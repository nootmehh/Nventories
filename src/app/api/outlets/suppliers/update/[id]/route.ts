import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const supplierId = url.pathname.split('/').pop(); // ambil [id] dari URL

    if (!supplierId) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 });
    }

    const {
      supplierCode,
      supplierName,
      phoneNumber,
      email,
      address,
      province,
      city,
      description,
      outletId
    } = await request.json();

    if (!supplierCode || !supplierName || !address || !outletId) {
      return NextResponse.json({ message: 'All required fields are needed.' }, { status: 400 });
    }

    // ✅ Gunakan connectionString dari env
    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    const result = await client.sql`
      UPDATE suppliers
      SET supplier_code = ${supplierCode},
          supplier_name = ${supplierName},
          phone_number = ${phoneNumber ?? null},
          email = ${email ?? null},
          address = ${address},
          province = ${province ?? null},
          city = ${city ?? null},
          description = ${description ?? null},
          outlet_id = ${outletId}
      WHERE id = ${supplierId}
      RETURNING id
    `;

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supplier updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/suppliers/update/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
