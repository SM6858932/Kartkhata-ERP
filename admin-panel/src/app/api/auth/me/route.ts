import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    try {
        const uid = req.cookies.get('adminSession')?.value;
        if (!uid) {
            return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 });
        }

        const userSnap = await db().collection('users').doc(uid).get();
        const user = userSnap.exists ? { uid, ...userSnap.data() } : null;

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
