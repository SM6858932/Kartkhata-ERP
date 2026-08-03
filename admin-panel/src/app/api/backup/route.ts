import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

async function currentUser(req: NextRequest): Promise<{ uid: string; role: string; companyId: string } | null> {
    const uid = req.cookies.get('adminSession')?.value;
    if (!uid) return null;
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) return { uid, role: '', companyId: '' };
    const data = snap.data();
    return { uid, role: data?.role || '', companyId: data?.companyId || '' };
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const companyId = user.companyId;
        const isSuperAdmin = user.role === 'super_admin' || user.role === 'admin';

        // Build backup data
        const backup: Record<string, any> = {
            exportedAt: new Date().toISOString(),
            exportedBy: user.uid,
            version: '1.0',
        };

        if (companyId) {
            // Company-scoped backup
            const collections = ['vendors', 'carts', 'agreements', 'payments', 'auditLogs', 'notifications', 'zones'];
            for (const colName of collections) {
                const snap = await db()
                    .collection('companies').doc(companyId)
                    .collection(colName).get();
                backup[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            // Include company info
            const companyDoc = await db().collection('companies').doc(companyId).get();
            backup.company = companyDoc.exists ? { id: companyDoc.id, ...companyDoc.data() } : null;

            // Include users for this company
            const usersSnap = await db()
                .collection('users').where('companyId', '==', companyId).get();
            backup.users = usersSnap.docs.map(d => {
                const data = d.data();
                // Don't include passwords in backup
                const { credentials, ...safe } = data;
                return { id: d.id, ...safe };
            });
        } else if (isSuperAdmin) {
            // Full system backup for super admin
            const companiesSnap = await db().collection('companies').get();
            backup.companies = [];

            for (const compDoc of companiesSnap.docs) {
                const companyData: any = { id: compDoc.id, ...compDoc.data() };
                const collections = ['vendors', 'carts', 'agreements', 'payments', 'auditLogs', 'notifications', 'zones'];

                for (const colName of collections) {
                    const snap = await db()
                        .collection('companies').doc(compDoc.id)
                        .collection(colName).get();
                    companyData[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }

                backup.companies.push(companyData);
            }

            // Top-level users
            const usersSnap = await db().collection('users').get();
            backup.users = usersSnap.docs.map(d => {
                const data = d.data();
                const { credentials, ...safe } = data;
                return { id: d.id, ...safe };
            });
        }

        // Return the backup as a downloadable JSON file directly.
        // No Firebase Storage dependency — downloads work immediately.
        const json = JSON.stringify(backup, null, 2);
        const fileName = `cartkhata-backup-${companyId || 'full-system'}-${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(json, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (err: any) {
        console.error('backup error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        // Backup history is not persisted (no Firebase Storage bucket).
        // Return an empty list; backups are on-demand downloadable files.
        return NextResponse.json({ success: true, data: [] });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
