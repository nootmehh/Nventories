// src/app/api/outlets/accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
    }

    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    const result = await client.query(
      `SELECT id, name AS username, email, role 
       FROM users 
       WHERE outlet_id = $1`,
      [id]
    );

    await client.end();

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('API /outlets/accounts/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
