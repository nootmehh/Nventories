import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // ambil id dari path

    if (!id) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 });
    }

    // ✅ Gunakan connectionString dari env
    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    const result = await client.sql`
      DELETE FROM suppliers
      WHERE id = ${id}
      RETURNING id
    `;

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supplier deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/suppliers/delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
