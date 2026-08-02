import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    try {
        const companyId = req.nextUrl.searchParams.get('companyId');
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'companyId required' }, { status: 400 });
        }

        const snapshot = await db()
            .collection('users')
            .where('companyId', '==', companyId)
            .orderBy('createdAt', 'desc')
            .get();

        const users = snapshot.docs.map(d => {
            const data = d.data();
            return {
                uid: d.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                role: data.role,
                active: data.active,
                assignedVendorIds: data.assignedVendorIds || [],
            };
        });

        return NextResponse.json({ success: true, data: users });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
