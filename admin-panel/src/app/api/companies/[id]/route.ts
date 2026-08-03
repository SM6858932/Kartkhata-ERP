import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';
import { isSuperAdminRole, isCompanyAdminRole } from '@/lib/roles';
import { uploadLogo, deleteLogo } from '@/lib/appwrite-storage';

async function currentUser(req: NextRequest): Promise<{ uid: string; role: string; companyId: string } | null> {
    const uid = req.cookies.get('adminSession')?.value;
    if (!uid) return null;
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) return { uid, role: '', companyId: '' };
    const data = snap.data();
    return { uid, role: data?.role || '', companyId: data?.companyId || '' };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await currentUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const companyId = params.id;
        const isSuper = isSuperAdminRole(user.role);
        const isCompanyAdmin = isCompanyAdminRole(user.role);

        // Super admin can edit any company; company admin can only edit their own
        if (!isSuper && !isCompanyAdmin) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        if (!isSuper && user.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Forbidden: can only edit your own company' }, { status: 403 });
        }

        // Support both JSON and multipart/form-data (for logo upload)
        const contentType = req.headers.get('content-type') || '';
        let body: Record<string, any> = {};
        let logoFile: File | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const fields = ['name', 'ownerName', 'address', 'ownerMobile', 'ownerEmail', 'phone', 'email'];
            for (const f of fields) {
                const v = formData.get(f);
                if (v) body[f] = v as string;
            }
            logoFile = formData.get('logo') as File | null;
        } else {
            body = await req.json();
        }

        // Update logo if a new file was uploaded
        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            const newLogoUrl = await uploadLogo(companyId, buffer, logoFile.type, logoFile.name);

            // Delete old logo if it exists
            const compSnap = await db().collection('companies').doc(companyId).get();
            if (compSnap.exists) {
                const oldLogo = compSnap.data()?.logoUrl as string | undefined;
                if (oldLogo) {
                    try { await deleteLogo(oldLogo); } catch { /* ignore */ }
                }
            }
            body.logoUrl = newLogoUrl;
        }

        await db().collection('companies').doc(companyId).update({
            ...body,
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('update company error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await currentUser(req);
        if (!user || !isSuperAdminRole(user.role)) {
            return NextResponse.json({ success: false, error: 'Forbidden: super admin only' }, { status: 403 });
        }

        const companyId = params.id;
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'companyId required' }, { status: 400 });
        }

        // Delete all users of the company (Firebase Auth + users docs)
        const usersSnap = await db().collection('users').where('companyId', '==', companyId).get();
        await Promise.all(usersSnap.docs.map(async d => {
            try {
                await auth().deleteUser(d.id);
            } catch (err: any) {
                console.warn(`Failed to delete auth user ${d.id}:`, err.message);
            }
            await d.ref.delete();
        }));

        // Delete company doc + all subcollections (vendors, carts, agreements, payments, ...)
        await db().recursiveDelete(db().collection('companies').doc(companyId));

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('delete company error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
