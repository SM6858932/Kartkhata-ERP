import { NextRequest, NextResponse } from 'next/server';
import { db, serverTimestamp } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
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
