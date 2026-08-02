import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';

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
        if (!user || user.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden: super admin only' }, { status: 403 });
        }

        const body = await req.json();
        await db().collection('companies').doc(params.id).update({
            ...body,
            updatedAt: serverTimestamp(),
        });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await currentUser(req);
        if (!user || user.role !== 'super_admin') {
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
