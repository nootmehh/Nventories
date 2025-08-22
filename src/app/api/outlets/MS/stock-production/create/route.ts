import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      outletId,
      productionType,
      finishedName,
      finishedSku,
      finishedUnit,
      finishedAmount,
      finishedGoodId,
      products,
    } = body as any;

    if (!outletId) {
      return NextResponse.json({ message: 'Missing outletId' }, { status: 400 });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ message: 'Products (materials) are required.' }, { status: 400 });
    }

    if (productionType === 'new') {
      if (!finishedName || !finishedSku || !finishedUnit || !finishedAmount) {
        return NextResponse.json({ message: 'Missing finished goods information.' }, { status: 400 });
      }
    } else {
      if (!finishedGoodId) {
        return NextResponse.json({ message: 'finishedGoodId is required for existing finished goods.' }, { status: 400 });
      }
    }

    const client = createClient({ connectionString: process.env.POSTGRES_URL });
    await client.connect();

    try {
      await client.sql`BEGIN`;

      let finalFinishedGoodId = finishedGoodId;

      if (productionType === 'new') {
        // compute total cost from provided materials
        const totalCost = products.reduce((acc: number, p: any) => {
          const qty = Number(p.quantity_used ?? p.quantity ?? 0) || 0;
          const price = Number(p.price_per_unit ?? 0) || 0;
          return acc + qty * price;
        }, 0);

        const pricePerUnit = finishedAmount ? Number((totalCost / Number(finishedAmount)).toFixed(2)) : 0;

        const insertFinished = await client.sql`
          INSERT INTO finished_goods (outlet_id, sku, product_name, initial_stock, remaining_stock, unit_name, price_per_unit)
          VALUES (${outletId}, ${finishedSku}, ${finishedName}, ${Number(finishedAmount)}, ${Number(finishedAmount)}, ${finishedUnit}, ${pricePerUnit})
          RETURNING id
        `;

        finalFinishedGoodId = insertFinished.rows[0]?.id;
      } else {
        // add produced quantity to existing finished goods remaining_stock
        await client.sql`
          UPDATE finished_goods
          SET remaining_stock = remaining_stock + ${Number(finishedAmount)}
          WHERE id = ${finishedGoodId}
        `;
      }

      const insertRun = await client.sql`
        INSERT INTO production_runs (outlet_id, finished_good_id, quantity_produced)
        VALUES (${outletId}, ${finalFinishedGoodId}, ${Number(finishedAmount)})
        RETURNING id
      `;

      const productionRunId = insertRun.rows[0]?.id;

      // insert materials and decrement raw material stock
      for (const p of products) {
        const rawId = p.raw_material_id ?? p.id;
        const qtyUsed = Number(p.quantity_used ?? p.quantity ?? 0) || 0;

        await client.sql`
          INSERT INTO production_materials (production_run_id, raw_material_id, quantity_used)
          VALUES (${productionRunId}, ${rawId}, ${qtyUsed})
        `;

        // capture current remaining_stock as opening_stock, then decrement remaining_stock
        // we do a SELECT first to read current remaining_stock
        const current = await client.sql`
          SELECT remaining_stock FROM raw_material WHERE id = ${rawId} FOR UPDATE
        `;
        const currentRemaining = Number(current.rows[0]?.remaining_stock ?? 0) || 0;

        await client.sql`
          UPDATE raw_material
          SET opening_stock = ${currentRemaining},
              remaining_stock = GREATEST(remaining_stock - ${qtyUsed}, 0),
              stock_in_production = COALESCE(stock_in_production, 0) + ${qtyUsed}
          WHERE id = ${rawId}
        `;
      }

      await client.sql`COMMIT`;
      await client.end();

      return NextResponse.json({ message: 'Production run created', productionRunId, finishedGoodId: finalFinishedGoodId }, { status: 201 });
    } catch (err) {
      await client.sql`ROLLBACK`;
      await client.end();
      console.error('Transaction error /api/outlets/MS/stock-production/create:', err);
      return NextResponse.json({ message: 'Transaction failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /outlets/MS/stock-production/create error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
