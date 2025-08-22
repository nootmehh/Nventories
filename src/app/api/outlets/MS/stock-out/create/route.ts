import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { outletId, items, stockOutNumber, transactionDate, images } = await request.json();
    if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing outletId or items' }, { status: 400 });
    }

    let imagesArray: string[] | null = null;
    if (images) {
      if (!Array.isArray(images)) return NextResponse.json({ message: 'images must be an array' }, { status: 400 });
      imagesArray = images.map((i: any) => String(i));
    }

    try {
      await client.query('BEGIN');
      const created: any[] = [];

      for (const it of items) {
        const finishedGoodId = it.finished_good_id || it.finishedGoodId || it.raw_material_id || null;
        const quantityOut = Number(it.quantity_out || 0);
  // normalize transaction date: if provided, parse to ISO string; otherwise null here
  const transactionDateVal = transactionDate ? new Date(transactionDate).toISOString() : null;
        // ensure stock_out_number is present; generate if not provided
        const stockOutNumberValue = stockOutNumber || `SO-${outletId}-${Date.now()}`;

        if (!finishedGoodId || quantityOut <= 0) {
          throw new Error('Invalid item payload');
        }

        // use COALESCE to default transaction_date to NOW() if transactionDateVal is null
        const insert = await client.sql`
          INSERT INTO stock_out (outlet_id, finished_good_id, stock_out_number, quantity_out, transaction_date, image_urls)
          VALUES (${outletId}, ${finishedGoodId}, ${stockOutNumberValue}, ${quantityOut}, COALESCE(${transactionDateVal}, NOW()), ${imagesArray ? JSON.stringify(imagesArray) : null})
          RETURNING id
        `;

        created.push(insert.rows[0]);

        // decrement remaining_stock on finished_goods
        try {
          const fgQ = await client.sql`
            SELECT id, remaining_stock, initial_stock
            FROM finished_goods
            WHERE id = ${finishedGoodId}
            LIMIT 1
          `;
          const fgRow = fgQ && (fgQ as any).rows && (fgQ as any).rows[0] ? (fgQ as any).rows[0] : null;
          if (fgRow) {
            const currentRemaining = fgRow.remaining_stock == null ? 0 : Number(fgRow.remaining_stock);
            const currentInitial = fgRow.initial_stock == null ? 0 : Number(fgRow.initial_stock);
            // validate availability
            if (quantityOut > currentRemaining) {
              throw new Error('Stock unavailable!');
            }
            const newRemaining = currentRemaining - quantityOut;
            const newInitial = Math.max(0, currentInitial - quantityOut);
            await client.sql`
              UPDATE finished_goods SET remaining_stock = ${newRemaining}, initial_stock = ${newInitial}, updated_at = NOW() WHERE id = ${finishedGoodId}
            `;
          }
        } catch (fgErr) {
          console.error('Failed to update finished_goods after stock_out insert', fgErr);
          throw fgErr;
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Stock out records created', created }, { status: 201 });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      console.error('Transaction error creating stock_out:', txErr);
      return NextResponse.json({ message: txErr?.message || 'Failed to create stock out' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /outlets/MS/stock-out/create error:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
  } finally {
    try { await client.end(); } catch (e) { console.error('Error closing DB client:', e); }
  }
}
