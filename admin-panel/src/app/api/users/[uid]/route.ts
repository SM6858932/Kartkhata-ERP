import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';
import { isSuperAdminRole, isCompanyAdminRole } from '@/lib/roles';

async function currentUser(req: NextRequest): Promise<{ uid: string; role: string; companyId: string } | null> {
    const uid = req.cookies.get('adminSession')?.value;
    if (!uid) return null;
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) return { uid, role: '', companyId: '' };
    const data = snap.data();
    return { uid, role: data?.role || '', companyId: data?.companyId || '' };
}

async function canManageTarget(me: { role: string; companyId: string }, targetCompanyId: string): Promise<boolean> {
    if (isSuperAdminRole(me.role)) return true;
    if (isCompanyAdminRole(me.role) && me.companyId === targetCompanyId) return true;
    return false;
}

export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const me = await currentUser(req);
        if (!me) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const targetUid = params.uid;
        const targetSnap = await db().collection('users').doc(targetUid).get();
        if (!targetSnap.exists) {
            return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
        }
        const target = targetSnap.data()!;

        if (!(await canManageTarget(me, target.companyId || ''))) {
            return NextResponse.json({ success: false, error: 'Forbidden: can only manage staff in your own company' }, { status: 403 });
        }

        const { name, phone, assignedVendorIds, role } = await req.json();

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (assignedVendorIds !== undefined) updateData.assignedVendorIds = assignedVendorIds;
        if (role !== undefined && ['collector', 'staff', 'company_admin'].includes(role)) updateData.role = role;

        // Update Firebase Auth displayName if name changed
        if (name !== undefined) {
            try {
                await auth().updateUser(targetUid, { displayName: name });
            } catch { /* ignore auth errors */ }
        }

        // Update custom claims if role changed
        if (role !== undefined && ['collector', 'staff', 'company_admin'].includes(role)) {
            try {
                await auth().setCustomUserClaims(targetUid, {
                    role,
                    companyId: target.companyId || '',
                    assignedToVendorIds: assignedVendorIds !== undefined ? assignedVendorIds : (target.assignedVendorIds || []),
                });
            } catch { /* ignore */ }
        }

        await db().collection('users').doc(targetUid).update({
            ...updateData,
            updatedAt: serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('update staff error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { uid: string } }) {
    try {
        const me = await currentUser(req);
        if (!me) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const targetUid = params.uid;
        const targetSnap = await db().collection('users').doc(targetUid).get();
        if (!targetSnap.exists) {
            return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
        }
        const target = targetSnap.data()!;

        if (!(await canManageTarget(me, target.companyId || ''))) {
            return NextResponse.json({ success: false, error: 'Forbidden: can only manage staff in your own company' }, { status: 403 });
        }

        // Prevent deleting yourself
        if (targetUid === me.uid) {
            return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 });
        }

        // Delete Firebase Auth user
        try {
            await auth().deleteUser(targetUid);
        } catch (err: any) {
            console.warn(`Failed to delete auth user ${targetUid}:`, err.message);
        }

        // Delete the users doc
        await db().collection('users').doc(targetUid).delete();

        // Remove from company credentials
        if (target.companyId) {
            const compRef = db().collection('companies').doc(target.companyId);
            const compSnap = await compRef.get();
            if (compSnap.exists) {
                const creds = (compSnap.data()?.credentials as any[]) || [];
                const filtered = creds.filter(c => c.uid !== targetUid);
                await compRef.update({ credentials: filtered, updatedAt: serverTimestamp() });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('delete staff error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
