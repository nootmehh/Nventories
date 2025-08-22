import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const url = new URL(request.url);
    const outletId = url.searchParams.get('outletId');
    if (!outletId) return NextResponse.json({ message: 'Missing outletId' }, { status: 400 });

    // aggregate finished goods per stock_out into a readable list: "Name (qty), Other (qty)"
    const q = await client.sql`
      SELECT so.stock_out_number as stock_out_no, so.id as stock_out_id, so.transaction_date as out_date,
        string_agg( (fg.product_name || ' (' || so.quantity_out || ')') , ', ') as product_list
      FROM stock_out so
      LEFT JOIN finished_goods fg ON fg.id = so.finished_good_id
      WHERE so.outlet_id = ${outletId}
      GROUP BY so.id
      ORDER BY so.transaction_date DESC
      LIMIT 100
    `;

    const rows = (q as any).rows || [];
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: any) {
    console.error('stock-out list error', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  } finally { try { await client.end(); } catch(e){ console.error(e); } }
}
