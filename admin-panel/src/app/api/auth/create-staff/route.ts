import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { name, phone, password, companyId, assignedVendorIds } = await req.json();

        if (!name || !phone || !password || !companyId) {
            return NextResponse.json({ success: false, error: 'name, phone, password, companyId required' }, { status: 400 });
        }

        const email = `${name.toLowerCase().replace(/\s+/g, '')}_staff@cartkhata.com`;

        const userRecord = await auth().createUser({
            email,
            password,
            displayName: name,
            phoneNumber: phone,
        });

        const { db, serverTimestamp } = await import('@/lib/firebase-admin');
        await db().collection('users').doc(userRecord.uid).set({
            name, phone, email,
            role: 'collector',
            companyId,
            active: true,
            assignedVendorIds: assignedVendorIds || [],
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            data: { uid: userRecord.uid, email, password },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
