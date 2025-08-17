import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { invoiceId, items, images } = await request.json();
    if (!invoiceId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing invoiceId or items' }, { status: 400 });
    }

    // images should be an array of string URLs when provided
    let imagesArray: string[] | null = null;
    if (images) {
      if (!Array.isArray(images)) return NextResponse.json({ message: 'images must be an array' }, { status: 400 });
      imagesArray = images.map((i: any) => String(i));
    }

    try {
      // Validate items before beginning transaction to provide friendly errors
      const missingDates = [] as any[];
      const missingIds = [] as any[];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it) continue;
        if (!it.purchase_invoice_item_id) missingIds.push({ index: i });
        // received_date must be provided (DB has NOT NULL constraint)
        if (!it.received_date) missingDates.push({ index: i, purchase_invoice_item_id: it.purchase_invoice_item_id });
      }
      if (missingIds.length > 0) {
        return NextResponse.json({ message: 'One or more items are missing required identifiers.' }, { status: 400 });
      }
      if (missingDates.length > 0) {
        return NextResponse.json({ message: 'Please select a Received Date for every product before saving.' }, { status: 400 });
      }

      await client.query('BEGIN');
      const created: any[] = [];

      for (const it of items) {
        const purchaseInvoiceItemId = it.purchase_invoice_item_id;
        const quantityIn = Number(it.quantity_in || 0);
        const totalValue = Number(it.total_value || 0).toFixed(2);
        const receivedDate = it.received_date || null;

        if (!purchaseInvoiceItemId || quantityIn <= 0) {
          throw new Error('Invalid item payload');
        }

        const insert = await client.sql`
          INSERT INTO stock_in (purchase_invoice_item_id, quantity_in, total_value, received_date, image_urls)
          VALUES (${purchaseInvoiceItemId}, ${quantityIn}, ${totalValue}, ${receivedDate}, ${imagesArray ? JSON.stringify(imagesArray) : null})
          RETURNING id
        `;

        created.push(insert.rows[0]);

        // Update corresponding raw_material stock_in and remaining_stock
        try {
          const rmQ = await client.sql`
            SELECT rm.id AS raw_material_id, rm.opening_stock, rm.stock_in
            FROM raw_material rm
            JOIN purchase_order_details pod ON pod.raw_material_id = rm.id
            JOIN purchase_invoice_items pii ON pii.purchase_order_detail_id = pod.id
            WHERE pii.id = ${purchaseInvoiceItemId}
            LIMIT 1
          `;

          const rmRow = rmQ && (rmQ as any).rows && (rmQ as any).rows[0] ? (rmQ as any).rows[0] : null;
          if (rmRow) {
            const rawMaterialId = rmRow.raw_material_id;
            const openingStock = Number(rmRow.opening_stock || 0);
            const currentStockIn = rmRow.stock_in === null || rmRow.stock_in === undefined ? null : Number(rmRow.stock_in);

            // If current stock_in is null/0 -> add quantityIn (effectively becomes quantityIn)
            // Otherwise replace with the new quantityIn
            let newStockIn: number | null;
            if (currentStockIn === null || currentStockIn === 0) {
              newStockIn = (currentStockIn || 0) + quantityIn;
            } else {
              newStockIn = quantityIn;
            }

            const newRemaining = openingStock + (newStockIn || 0);

            await client.sql`
              UPDATE raw_material
              SET stock_in = ${newStockIn}, remaining_stock = ${newRemaining}, updated_at = NOW()
              WHERE id = ${rawMaterialId}
            `;
          }
        } catch (rmErr) {
          console.error('Failed to update raw_material stock after stock_in insert', rmErr);
          throw rmErr;
        }
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Stock in records created', created }, { status: 201 });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      console.error('Transaction error creating stock_in:', txErr);
      return NextResponse.json({ message: txErr?.message || 'Failed to create stock in' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /outlets/SP/stock-in/create error:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
  } finally {
    try { await client.end(); } catch (e) { console.error('Error closing DB client:', e); }
  }
}
