import { NextRequest, NextResponse } from 'next/server';
import { auth, db, serverTimestamp } from '@/lib/firebase-admin';
import { uploadLogo } from '@/lib/appwrite-storage';

export async function GET() {
    try {
        const snapshot = await db().collection('companies').orderBy('createdAt', 'desc').get();
        const companies = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ success: true, data: companies });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const ownerName = formData.get('ownerName') as string;
        const adminEmail = formData.get('adminEmail') as string;
        const adminPassword = formData.get('adminPassword') as string;
        const adminPhone = formData.get('adminPhone') as string;
        const logoFile = formData.get('logo') as File | null;

        if (!name || !ownerName || !adminEmail || !adminPassword) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const companyRef = db().collection('companies').doc();
        const companyId = companyRef.id;

        let logoUrl = '';
        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            logoUrl = await uploadLogo(companyId, buffer, logoFile.type, logoFile.name);
        }

        await companyRef.set({
            name, ownerName, logoUrl, active: true,
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });

        const adminRecord = await auth().createUser({
            email: adminEmail, password: adminPassword,
            displayName: `${ownerName} (Admin)`, phoneNumber: adminPhone,
        });

        await db().collection('users').doc(adminRecord.uid).set({
            name: `${ownerName} (Admin)`, phone: adminPhone, email: adminEmail,
            role: 'company_admin', companyId, active: true,
            assignedVendorIds: [], createdAt: serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            data: {
                companyId, adminUid: adminRecord.uid,
                name, ownerName, logoUrl,
            },
        });
    } catch (err: any) {
        console.error('create company error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}