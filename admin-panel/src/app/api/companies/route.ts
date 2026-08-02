import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminRole } from '@/lib/roles';

import { auth, db, serverTimestamp } from '@/lib/firebase-admin';
import { uploadLogo } from '@/lib/appwrite-storage';

async function currentUser(req: NextRequest): Promise<{ uid: string; role: string; companyId: string } | null> {
    const uid = req.cookies.get('adminSession')?.value;
    if (!uid) return null;
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) return { uid, role: '', companyId: '' };
    const data = snap.data();
    return { uid, role: data?.role || '', companyId: data?.companyId || '' };
}

interface AccountInput {
    role: 'admin' | 'collector';
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export async function GET(req: NextRequest) {
    try {
        const user = await currentUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
        if (isSuperAdminRole(user.role)) {
            q = db().collection('companies').orderBy('createdAt', 'desc');
        } else if (user.companyId) {
            q = db().collection('companies')
                .where('__name__', '==', user.companyId)
                .orderBy('createdAt', 'desc');
        } else {
            q = db().collection('companies').where('active', '==', false);
        }

        const snapshot = await q.get();
        const companies = snapshot.docs.map(d => {
            const data = d.data();
            // Credentials (stored passwords) are only exposed to the super admin
            if (!isSuperAdminRole(user.role)) {
                delete data.credentials;
            }
            return { id: d.id, ...data };
        });
        return NextResponse.json({ success: true, data: companies });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser(req);
        if (!user || !isSuperAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden: super admin only' }, { status: 403 });
        }

        const formData = await req.formData();
        const name = formData.get('name') as string;
        const ownerName = formData.get('ownerName') as string;
        const ownerMobile = formData.get('ownerMobile') as string;
        const address = formData.get('address') as string;
        const logoFile = formData.get('logo') as File | null;

        if (!name || !ownerName) {
            return NextResponse.json({ success: false, error: 'Company name and owner name are required' }, { status: 400 });
        }

        // Accounts with chosen role (admin/collector) + email + password
        let accounts: AccountInput[] = [];
        const accountsRaw = formData.get('accounts');
        if (accountsRaw) {
            try { accounts = JSON.parse(accountsRaw as string); } catch { /* ignore */ }
        }
        if (accounts.length === 0) {
            // Legacy single-admin form support
            const adminEmail = formData.get('adminEmail') as string;
            const adminPassword = formData.get('adminPassword') as string;
            const adminPhone = formData.get('adminPhone') as string;
            if (adminEmail && adminPassword) {
                accounts.push({ role: 'admin', name: `${ownerName} (Admin)`, email: adminEmail, password: adminPassword, phone: adminPhone });
            }
        }
        accounts = accounts.filter(a => a.email && a.password && a.name);
        if (accounts.length === 0) {
            return NextResponse.json({ success: false, error: 'At least one account (role, name, email, password) is required' }, { status: 400 });
        }

        const companyRef = db().collection('companies').doc();
        const companyId = companyRef.id;

        let logoUrl = '';
        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            logoUrl = await uploadLogo(companyId, buffer, logoFile.type, logoFile.name);
        }

        const created: any[] = [];
        for (const acc of accounts) {
            const role = acc.role === 'admin' ? 'company_admin' : 'collector';
            const userRecord = await auth().createUser({
                email: acc.email,
                password: acc.password,
                displayName: acc.name,
                ...(acc.phone ? { phoneNumber: acc.phone } : {}),
            });

            await db().collection('users').doc(userRecord.uid).set({
                name: acc.name,
                phone: acc.phone || '',
                email: acc.email,
                role,
                companyId,
                active: true,
                assignedVendorIds: [],
                createdAt: serverTimestamp(),
            });

            created.push({
                uid: userRecord.uid, role, name: acc.name,
                email: acc.email, password: acc.password, phone: acc.phone || '',
            });
        }

        await companyRef.set({
            name,
            ownerName,
            logoUrl,
            active: true,
            ownerMobile: ownerMobile || '',
            address: address || '',
            credentials: created,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            data: { companyId, name, ownerName, logoUrl, accounts: created },
        });
    } catch (err: any) {
        console.error('create company error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
