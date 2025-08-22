import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ message: 'id is required' }, { status: 400 });

    const client = createClient({ connectionString: process.env.POSTGRES_URL });
    await client.connect();
    try {
      await client.query('BEGIN');

      // fetch details for this return
      const details = await client.sql`SELECT raw_material_id, quantity_returned FROM purchase_return_details WHERE purchase_return_id = ${id}`;

      // restore remaining_stock for each raw_material
      for (const d of details.rows) {
        const rmId = Number(d.raw_material_id);
        const qty = Number(d.quantity_returned || 0);
        const lock = await client.sql`SELECT remaining_stock FROM raw_material WHERE id = ${rmId} FOR UPDATE`;
        const cur = Number(lock.rows[0]?.remaining_stock || 0);
        const newRem = cur + qty;
        await client.sql`UPDATE raw_material SET remaining_stock = ${newRem}, updated_at = NOW() WHERE id = ${rmId}`;
      }

      // delete details then return
      await client.sql`DELETE FROM purchase_return_details WHERE purchase_return_id = ${id}`;
      await client.sql`DELETE FROM purchase_returns WHERE id = ${id}`;

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Purchase return deleted and stock restored' }, { status: 200 });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      console.error('Error deleting purchase_return', txErr);
      return NextResponse.json({ message: txErr?.message || 'Failed to delete' }, { status: 500 });
    } finally {
      try { await client.end(); } catch (e) { console.error(e); }
    }
  } catch (err: any) {
    console.error('API delete purchase_return error', err);
    return NextResponse.json({ message: err?.message || 'Invalid request' }, { status: 400 });
  }
}
