import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL as string,
  });

  try {
    const {
      outletId,
      invoiceNumber,
      supplierId,
      orderDate,
      invoiceProcess,
      deliveryStatus,
      totalAmount,
      dpAmount,
      discountAmount,
      taxAmount,
      products,
    } = await request.json();

    if (!outletId || !invoiceNumber || !supplierId || !orderDate || !products?.length) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    await client.connect();
    await client.sql`BEGIN`;

    try {
      // Insert purchase order
      const orderResult = await client.sql`
        INSERT INTO purchase_orders 
          (outlet_id, supplier_id, invoice_number, order_date, total_amount, dp_amount, discount_amount, tax_amount, delivery_status, invoice_process)
        VALUES 
          (${outletId}, ${supplierId}, ${invoiceNumber}, ${orderDate}, ${totalAmount}, ${dpAmount}, ${discountAmount}, ${taxAmount}, ${deliveryStatus}, ${invoiceProcess})
        RETURNING id
      `;
      const purchaseOrderId = orderResult.rows[0].id;

      // Insert products
      for (const product of products) {
        await client.sql`
          INSERT INTO purchase_order_details 
            (purchase_order_id, raw_material_id, quantity, unit_price, subtotal)
          VALUES 
            (${purchaseOrderId}, ${product.id}, ${product.quantity}, ${product.price_per_unit}, ${product.quantity * product.price_per_unit})
        `;
      }

      await client.sql`COMMIT`;

      return NextResponse.json({ message: 'Purchase order created successfully.' }, { status: 201 });

    } catch (transactionError: any) {
      await client.sql`ROLLBACK`;
      console.error('Transaction error:', transactionError);
      return NextResponse.json({ message: `Failed to create purchase order: ${transactionError.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API /outlets/SP/porder/create error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
