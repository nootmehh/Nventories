// src/app/api/outlets/update/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@vercel/postgres';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
  }

  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();

  try {
    const { outletName, outletStatus, country, city, fullAddress, managerId, accounts } = await request.json();

    if (!outletName || !outletStatus || !country || !city || !fullAddress || !managerId || !accounts) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    await client.sql`BEGIN`;

    // 1. Update data outlet
    await client.sql`
      UPDATE outlets
      SET name = ${outletName}, status = ${outletStatus}, country = ${country}, city = ${city}, address = ${fullAddress}, manager_id = ${managerId}
      WHERE id = ${id}
    `;

    // 2. Ambil user yang sudah ada di outlet ini
    const existingAccountsResult = await client.sql`
      SELECT id, email FROM users WHERE outlet_id = ${id}
    `;
    const existingUsers = existingAccountsResult.rows;

    // 3. Tentukan akun yang akan dihapus & ditambah
    const newAccountEmails = accounts.map((acc: any) => acc.email);
    const accountsToDelete = existingUsers.filter((u) => !newAccountEmails.includes(u.email));
    const accountsToAdd = accounts.filter((acc: any) => !existingUsers.some((u) => u.email === acc.email));

    // 4. Hapus akun lama
    for (const acc of accountsToDelete) {
      await client.sql`DELETE FROM users WHERE id = ${acc.id}`;
    }

    // 5. Tambah akun baru
    for (const acc of accountsToAdd) {
      const hashedPassword = await bcrypt.hash(acc.password, 10);
      await client.sql`
        INSERT INTO users (name, email, password, role, outlet_id, has_completed_profile)
        VALUES (${acc.username}, ${acc.email}, ${hashedPassword}, ${acc.role}, ${id}, true)
      `;
    }

    await client.sql`COMMIT`;

    return NextResponse.json({ message: 'Outlet updated successfully.' }, { status: 200 });

  } catch (error: any) {
    await client.sql`ROLLBACK`;
    console.error('Transaction error:', error);
    return NextResponse.json({ message: `Failed to update outlet: ${error.message}` }, { status: 500 });
  } finally {
    await client.end();
  }
}
