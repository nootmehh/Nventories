import { NextRequest, NextResponse } from 'next/server';
import { createClient, sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();

  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    if (!businessId) {
      return NextResponse.json({ message: 'businessId is required' }, { status: 400 });
    }

    // Query dasar dengan businessId
    let queryStr = `
      SELECT
        o.id, o.name AS outlet_name, o.address, o.city, o.status,
        u.name AS manager_name
      FROM outlets o
      LEFT JOIN users u ON o.manager_id = u.id
      WHERE o.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    // Filter pencarian
    if (search && search.trim() !== '') {
      queryStr += ` AND o.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filter status
    if (status && status !== 'All status') {
      queryStr += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Urutkan
    queryStr += ` ORDER BY o.name ASC`;

    // Eksekusi query
    const result = await client.query(queryStr, params);

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('API /outlets/list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
