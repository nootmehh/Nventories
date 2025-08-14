import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');
    const searchQuery = searchParams.get('q')?.trim() || ''; // optional search query

    if (!outletId) {
      return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
    }

    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    let result;
    if (searchQuery) {
      // 🔹 Filter dengan searchQuery
      result = await client.sql`
        SELECT * FROM raw_material
        WHERE outlet_id = ${outletId} AND material_name ILIKE ${'%' + searchQuery + '%'}
      `;
    } else {
      // 🔹 Ambil semua jika searchQuery kosong
      result = await client.sql`
        SELECT * FROM raw_material
        WHERE outlet_id = ${outletId}
      `;
    }

    await client.end();

    return NextResponse.json({ data: result.rows }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/raw-material/list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
