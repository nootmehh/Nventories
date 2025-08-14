import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');
    const searchQuery = searchParams.get('q') || ''; // optional search

    if (!outletId) {
      return NextResponse.json({ message: 'outletId is required' }, { status: 400 });
    }

    // ✅ Gunakan connectionString dari env
    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    let result;
    if (searchQuery.trim() === '') {
      result = await client.sql`SELECT * FROM suppliers WHERE outlet_id = ${outletId}`;
    } else {
      result = await client.sql`
        SELECT * FROM suppliers
        WHERE outlet_id = ${outletId} AND supplier_name ILIKE ${`%${searchQuery}%`}
      `;
    }

    await client.end();

    const suppliers = result.rows;

    return NextResponse.json({ data: suppliers }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/suppliers/list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
