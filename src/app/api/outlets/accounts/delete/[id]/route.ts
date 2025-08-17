// src/app/api/outlets/accounts/delete/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userIdToDelete } = await params;
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    if (!userIdToDelete) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await client.connect();

    // 1. Ambil data user yang akan dihapus
    const userResult = await client.query(
      `SELECT role, outlet_id FROM users WHERE id = $1`,
      [userIdToDelete]
    );
    const userToDelete = userResult.rows[0];

    if (!userToDelete) {
      await client.end();
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // 2. Periksa apakah user yang akan dihapus adalah Manager
    if (userToDelete.role === 'Manager') {
      const managerCountResult = await client.query(
        `SELECT COUNT(*)::int AS count 
         FROM users 
         WHERE outlet_id = $1 AND role = 'Manager'`,
        [userToDelete.outlet_id]
      );
      const managerCount = managerCountResult.rows[0].count;

      if (managerCount <= 1) {
        await client.end();
        return NextResponse.json(
          { message: 'Cannot delete the last manager for this outlet.' },
          { status: 400 }
        );
      }
    }

    // 3. Hapus user
    await client.query(`DELETE FROM users WHERE id = $1`, [userIdToDelete]);

    await client.end();

    return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    await client.end();
    console.error('API /outlets/accounts/delete error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error.' }, { status: 500 });
  }
}
