import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });

    await client.connect();

    const result = await client.sql`
      INSERT INTO users (name, email, password, role, has_completed_profile)
      VALUES (${name}, ${email}, ${hashedPassword}, 'Owner', false)
      RETURNING id;
    `;

    await client.end(); // Tutup koneksi biar nggak leak

    if (!result.rows || result.rows.length === 0) {
      throw new Error('User creation failed');
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: result.rows[0].id },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 409 }
      );
    }

    console.error('Error during signup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
