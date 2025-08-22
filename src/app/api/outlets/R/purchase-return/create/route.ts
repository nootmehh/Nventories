import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { outletId, purchaseInvoiceId, returnNumber, returnDate, reason, items } = body || {};

    if (!outletId || !purchaseInvoiceId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing required fields: outletId, purchaseInvoiceId, items' }, { status: 400 });
    }

    const invalid = items.find((it: any) => Number(it.quantity) <= 0 || isNaN(Number(it.quantity)) || !it.product_id);
    if (invalid) {
      return NextResponse.json({ message: 'One or more items have invalid quantity or missing product_id' }, { status: 400 });
    }

    const client = createClient({ connectionString: process.env.POSTGRES_URL });
    await client.connect();

    try {
      await client.query('BEGIN');

      // Generate unique return number if not provided
      let finalReturnNumber = returnNumber;
      if (!finalReturnNumber) {
        const gen = `RET-${Date.now()}`;
        finalReturnNumber = gen;
      }

      // Insert into purchase_returns
      const insertReturn = await client.sql`
        INSERT INTO purchase_returns (purchase_invoice_id, return_number, return_date, reason)
        VALUES (${purchaseInvoiceId}, ${finalReturnNumber}, ${returnDate || new Date().toISOString().split('T')[0]}, ${reason || null})
        RETURNING id, return_number
      `;

      const purchaseReturnId = insertReturn.rows[0].id;

      // Insert each detail and update raw_material.remaining_stock
      for (const it of items) {
        const rawMaterialId = Number(it.product_id);
        const qty = Number(it.quantity);
        const unitPrice = Number(it.price_per_unit || 0);
        const totalValue = Number((qty * unitPrice).toFixed(2));

        // Lock the raw_material row
        const lockQ = await client.sql`SELECT id, remaining_stock FROM raw_material WHERE id = ${rawMaterialId} FOR UPDATE`;
        const rmRow = lockQ.rows[0];
        if (!rmRow) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: `Raw material id ${rawMaterialId} not found` }, { status: 400 });
        }

        // Insert detail
        await client.sql`
          INSERT INTO purchase_return_details (purchase_return_id, raw_material_id, quantity_returned, unit_price_return, total_value_return)
          VALUES (${purchaseReturnId}, ${rawMaterialId}, ${qty}, ${unitPrice}, ${totalValue})
        `;

        // Update remaining_stock (subtract returned quantity)
        const currentRemaining = Number(rmRow.remaining_stock || 0);
        const newRemaining = currentRemaining - qty;
        await client.sql`
          UPDATE raw_material SET remaining_stock = ${newRemaining}, updated_at = NOW() WHERE id = ${rawMaterialId}
        `;
      }

      await client.query('COMMIT');

      return NextResponse.json({ message: 'Purchase return created', data: { purchaseReturnId, returnNumber: finalReturnNumber } }, { status: 201 });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      console.error('Transaction error creating purchase_return:', txErr);
      return NextResponse.json({ message: txErr?.message || 'Failed to create purchase return' }, { status: 500 });
    } finally {
      try { await client.end(); } catch (e) { console.error('Error closing DB client:', e); }
    }
  } catch (err: any) {
    console.error('API /outlets/R/purchase-return/create error:', err);
    return NextResponse.json({ message: err?.message || 'Internal server error' }, { status: 500 });
  }
}
