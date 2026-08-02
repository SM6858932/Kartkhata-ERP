import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const uid = req.cookies.get('adminSession')?.value;
        if (!uid) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const meSnap = await db().collection('users').doc(uid).get();
        const me = meSnap.exists ? meSnap.data() : null;
        if (!me) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const { targetUid, password } = await req.json();
        if (!targetUid || !password || String(password).length < 6) {
            return NextResponse.json({ success: false, error: 'targetUid and a password of at least 6 characters are required' }, { status: 400 });
        }

        const targetSnap = await db().collection('users').doc(targetUid).get();
        if (!targetSnap.exists) {
            return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
        }
        const target = targetSnap.data()!;

        // super_admin can reset anyone; company_admin only their own company's users
        if (me.role !== 'super_admin' && (me.role !== 'company_admin' || me.companyId !== target.companyId)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await auth().updateUser(targetUid, { password });

        // Keep stored credentials in the company doc in sync
        if (target.companyId) {
            const compRef = db().collection('companies').doc(target.companyId);
            const compSnap = await compRef.get();
            if (compSnap.exists) {
                const creds = (compSnap.data()?.credentials as any[]) || [];
                const idx = creds.findIndex(c => c.uid === targetUid);
                if (idx >= 0) {
                    creds[idx] = { ...creds[idx], password, email: target.email || creds[idx].email };
                    await compRef.update({ credentials: creds });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('reset-password error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
