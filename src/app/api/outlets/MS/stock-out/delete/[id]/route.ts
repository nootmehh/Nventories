import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const url = new URL(request.url);
    const idStr = url.pathname.split('/').pop();
    if (!idStr) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    await client.query('BEGIN');

    // fetch the stock_out row so we can restore finished_goods stock
    const soQ: any = await client.sql`SELECT id, finished_good_id, quantity_out FROM stock_out WHERE id = ${id} LIMIT 1`;
    const soRow = soQ && soQ.rows && soQ.rows[0] ? soQ.rows[0] : null;
    if (!soRow) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    const finishedGoodId = soRow.finished_good_id;
    const qty = Number(soRow.quantity_out || 0);

    if (finishedGoodId && qty > 0) {
      // add back to remaining_stock and initial_stock
      await client.sql`
        UPDATE finished_goods
        SET remaining_stock = COALESCE(remaining_stock, 0) + ${qty},
            initial_stock = COALESCE(initial_stock, 0) + ${qty},
            updated_at = NOW()
        WHERE id = ${finishedGoodId}
      `;
    }

    // delete the stock_out row
    await client.sql`DELETE FROM stock_out WHERE id = ${id}`;

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Deleted and stock restored' }, { status: 200 });
  } catch (err: any) {
    try { await client.query('ROLLBACK'); } catch(e){ console.error('rollback failed', e); }
    console.error('stock-out delete error', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  } finally { try { await client.end(); } catch(e){ console.error(e); } }
}
