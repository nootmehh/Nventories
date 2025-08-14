// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });

    await client.connect();

    const { rows } = await client.sql`
      SELECT
        u.id, u.name, u.email, u.password, u.role, u.has_completed_profile, u.outlet_id,
        b.id AS business_id, b.business_name,
        o.id AS main_outlet_id, o.name AS main_outlet_name, o.city AS main_outlet_city, o.country AS main_outlet_country
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      LEFT JOIN outlets o ON b.main_outlet_id = o.id
      WHERE u.email = ${email}
    `;

    await client.end();

    const users = rows as any[];
    const user = users[0];

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outletId: user.outlet_id,
        has_completed_profile: user.has_completed_profile,
        business: {
          id: user.business_id || null,
          businessName: user.business_name || null,
          mainOutlet: {
            id: user.main_outlet_id || null,
            name: user.main_outlet_name || null,
            city: user.main_outlet_city || null,
            country: user.main_outlet_country || null,
          }
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
