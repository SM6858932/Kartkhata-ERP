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

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const companyId = req.nextUrl.searchParams.get('companyId') || user.companyId;
        const entityType = req.nextUrl.searchParams.get('entityType');
        const maxRecords = parseInt(req.nextUrl.searchParams.get('limit') || '100');

        let logs: any[] = [];

        if (companyId) {
            // Company-scoped audit logs
            let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = 
                db().collection('companies').doc(companyId).collection('auditLogs')
                    .orderBy('changedAt', 'desc')
                    .limit(maxRecords);

            if (entityType) {
                q = db().collection('companies').doc(companyId).collection('auditLogs')
                    .where('entityType', '==', entityType)
                    .orderBy('changedAt', 'desc')
                    .limit(maxRecords);
            }

            const snapshot = await q.get();
            logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
            // Top-level audit logs (super admin)
            let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = 
                db().collection('auditLogs')
                    .orderBy('changedAt', 'desc')
                    .limit(maxRecords);

            if (entityType) {
                q = db().collection('auditLogs')
                    .where('entityType', '==', entityType)
                    .orderBy('changedAt', 'desc')
                    .limit(maxRecords);
            }

            const snapshot = await q.get();
            logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        return NextResponse.json({ success: true, data: logs });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
