import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { name, phone, password, companyId, role, assignedVendorIds, email } = await req.json();

        if (!name || !phone || !password || !companyId) {
            return NextResponse.json({ success: false, error: 'name, phone, password, companyId required' }, { status: 400 });
        }

        const safeRole = ['company_admin', 'staff', 'collector'].includes(role) ? role : 'collector';
        const userEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}_staff@cartkhata.com`;

        const userRecord = await auth().createUser({
            email: userEmail,
            password,
            displayName: name,
            phoneNumber: phone,
        });

// Set custom claims so Firestore security rules can enforce company scoping
        await auth().setCustomUserClaims(userRecord.uid, {
            role: safeRole,
            companyId: companyId,
            assignedToVendorIds: assignedVendorIds || [],
        });

        await db().collection('users').doc(userRecord.uid).set({
            name, phone, email: userEmail,
            role: safeRole,
            companyId,
            active: true,
            assignedVendorIds: assignedVendorIds || [],
            createdAt: serverTimestamp(),
        });

        // Store credential on the company doc so the super admin can view/reset it later
        const compRef = db().collection('companies').doc(companyId);
        const compSnap = await compRef.get();
        if (compSnap.exists) {
            const creds = (compSnap.data()?.credentials as any[]) || [];
            creds.push({ uid: userRecord.uid, role: safeRole, name, email: userEmail, password, phone: phone || '' });
            await compRef.update({ credentials: creds, updatedAt: serverTimestamp() });
        }

        return NextResponse.json({
            success: true,
            data: { uid: userRecord.uid, email: userEmail, password, role: safeRole },
        });
    } catch (err: any) {
        console.error('create-staff error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
