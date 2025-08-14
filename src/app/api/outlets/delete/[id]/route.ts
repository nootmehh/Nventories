// src/app/api/outlets/delete/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ⬅ params dijadikan Promise
) {
  const { id: outletId } = await context.params; // ⬅ await sebelum pakai

  if (!outletId) {
    return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
  }

  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();

  try {
    await client.sql`BEGIN`;

    // 1. Cek apakah ini outlet utama
    const businessResult = await client.sql`
      SELECT id FROM businesses WHERE main_outlet_id = ${outletId}
    `;
    if (businessResult.rows.length > 0) {
      throw new Error('Cannot delete main outlet.');
    }

    // 2. Hapus semua akun yang terhubung ke outlet ini (kecuali Owner)
    await client.sql`
      DELETE FROM users WHERE outlet_id = ${outletId} AND role != 'Owner'
    `;

    // 3. Hapus outlet dari tabel outlets
    await client.sql`
      DELETE FROM outlets WHERE id = ${outletId}
    `;

    await client.sql`COMMIT`;

    return NextResponse.json({ message: 'Outlet and associated accounts deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    await client.sql`ROLLBACK`;
    console.error('Transaction error:', error);
    return NextResponse.json({ message: error.message || 'Failed to delete outlet.' }, { status: 500 });
  } finally {
    await client.end();
  }
}
