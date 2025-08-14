// src/app/api/outlets/get/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });

  await client.connect();

  try {
    const id = context.params.id;

    if (!id) {
      return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
    }

    const result = await client.sql`
      SELECT
        o.id, o.name AS outlet_name, o.address, o.city, o.status, o.country, o.manager_id,
        b.business_name, b.id AS business_id,
        u.name AS manager_name
      FROM outlets o
      LEFT JOIN businesses b ON o.business_id = b.id
      LEFT JOIN users u ON o.manager_id = u.id
      WHERE o.id = ${id}
    `;

    const outlet = result.rows[0];

    if (!outlet) {
      return NextResponse.json({ message: 'Outlet not found' }, { status: 404 });
    }

    return NextResponse.json({ data: outlet }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/get error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
