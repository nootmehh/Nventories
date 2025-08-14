import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
    const client = createClient({
        connectionString: process.env.POSTGRES_URL, // pastikan pakai pooled connection string
    });

    try {
        await client.connect();

        const {
            outletId,
            supplierName,
            supplierCode,
            phoneNumber,
            email,
            address,
            province,
            city,
            description
        } = await request.json();

        if (!outletId || !supplierName || !supplierCode || !address) {
            return NextResponse.json(
                { message: 'Outlet ID, name, code, and address are required.' },
                { status: 400 }
            );
        }

        const query = `
            INSERT INTO suppliers (
                outlet_id, supplier_name, supplier_code, phone_number, email, address, province, city, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await client.query(query, [
            outletId,
            supplierName,
            supplierCode,
            phoneNumber,
            email,
            address,
            province,
            city,
            description
        ]);

        return NextResponse.json({ message: 'Supplier added successfully.' }, { status: 201 });

    } catch (error: any) {
        console.error('API /outlets/suppliers/create error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error.' }, { status: 500 });
    } finally {
        await client.end();
    }
}
