import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, active } = await req.json();
    if (!uid) {
      return NextResponse.json({ success: false, error: 'uid required' }, { status: 400 });
    }

    const disabled = !(active === true);
    await auth().updateUser(uid, { disabled });
    await db().collection('users').doc(uid).update({ active: !disabled, updatedAt: serverTimestamp() });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('disable-user error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
