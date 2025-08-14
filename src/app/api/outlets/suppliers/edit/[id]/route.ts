import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const supplierId = url.pathname.split("/").pop(); // Ambil id dari URL

    if (!supplierId) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 });
    }

    // Buat client dengan connection string dari env
    const client = createClient({
      connectionString: process.env.POSTGRES_URL, // pastikan env sudah di-set
    });
    await client.connect();

    // Query supplier berdasarkan ID
    const result = await client.sql`
      SELECT * FROM suppliers WHERE id = ${supplierId}
    `;

    await client.end();

    const supplier = result.rows[0];

    if (!supplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ data: supplier }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/suppliers/edit error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
