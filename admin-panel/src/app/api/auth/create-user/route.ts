import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { name, phone, email, password, role, companyId, assignedVendorIds } = await req.json();

        if (!name || !phone || !password) {
            return NextResponse.json({ success: false, error: 'name, phone, and password required' }, { status: 400 });
        }

        const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}@cartkhata.com`;

        const userRecord = await auth.createUser({
            email: userEmail,
            password,
            displayName: name,
            phoneNumber: phone,
            disabled: false,
        });

        await db.collection('users').doc(userRecord.uid).set({
            name,
            phone,
            email: userEmail,
            role: role || 'collector',
            companyId: companyId || '',
            active: true,
            assignedVendorIds: assignedVendorIds || [],
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({ success: true, data: { uid: userRecord.uid } });
    } catch (err: any) {
        console.error('create-user error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
