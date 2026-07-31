import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ success: false, error: 'uid required' }, { status: 400 });
    }

    await auth().updateUser(uid, { disabled: true });
    await db().collection('users').doc(uid).update({ active: false, updatedAt: serverTimestamp() });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('disable-user error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
