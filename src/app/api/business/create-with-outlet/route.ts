// src/app/api/business/create-with-outlet/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: Request) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL, // pastikan sudah ada di .env.local
  }); // otomatis pooled client Vercel
  await client.connect();

  try {
    const { userId, businessName, outletName, country, city, address, businessSector } =
      await request.json();

    if (!userId || !businessName || !outletName || !country || !city || !address || !businessSector) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    await client.sql`BEGIN`;

    // 1. Simpan data bisnis
    const businessResult = await client.sql`
      INSERT INTO businesses (user_id, business_name, business_sector)
      VALUES (${userId}, ${businessName}, ${businessSector})
      RETURNING id
    `;
    const businessId = businessResult.rows[0].id;

    // 2. Simpan outlet pertama
    const outletResult = await client.sql`
      INSERT INTO outlets (business_id, name, country, city, address)
      VALUES (${businessId}, ${outletName}, ${country}, ${city}, ${address})
      RETURNING id
    `;
    const outletId = outletResult.rows[0].id;

    // 3. Set outlet utama di businesses
    await client.sql`
      UPDATE businesses SET main_outlet_id = ${outletId} WHERE id = ${businessId}
    `;

    // 4. Update has_completed_profile user
    await client.sql`
      UPDATE users SET has_completed_profile = TRUE WHERE id = ${userId}
    `;

    // Ambil data user terbaru
    const updatedUserResult = await client.sql`
      SELECT
        u.id, u.name, u.email, u.role, u.has_completed_profile,
        b.id AS business_id, b.business_name,
        o.id AS main_outlet_id, o.name AS main_outlet_name,
        o.city AS main_outlet_city, o.country AS main_outlet_country
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      LEFT JOIN outlets o ON b.main_outlet_id = o.id
      WHERE u.id = ${userId}
    `;
    const updatedUser = updatedUserResult.rows[0];

    await client.sql`COMMIT`;

    return NextResponse.json(
      {
        message: 'Business profile and main outlet created successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          has_completed_profile: updatedUser.has_completed_profile,
          business: {
            id: updatedUser.business_id,
            businessName: updatedUser.business_name,
            mainOutlet: {
              id: updatedUser.main_outlet_id,
              name: updatedUser.main_outlet_name,
              city: updatedUser.main_outlet_city,
              country: updatedUser.main_outlet_country,
            },
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    await client.sql`ROLLBACK`;
    console.error('API /api/business/create-with-outlet error:', error);
    return NextResponse.json({ message: `Failed to create business profile: ${error.message}` }, { status: 500 });
  } finally {
    await client.end(); // ganti client.release() dengan end() untuk createClient
  }
}
