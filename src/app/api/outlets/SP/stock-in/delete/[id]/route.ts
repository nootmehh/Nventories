import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

    await client.query('BEGIN');
    // Optionally: revoke or delete any related resources (images) if needed
    const del = await client.sql`
      DELETE FROM stock_in WHERE id = ${id} RETURNING id
    `;
    await client.query('COMMIT');
    if (!del || !del.rows || del.rows.length === 0) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted', id: del.rows[0].id }, { status: 200 });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('stock-in delete error', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  } finally {
    try { await client.end(); } catch {}
  }
}
