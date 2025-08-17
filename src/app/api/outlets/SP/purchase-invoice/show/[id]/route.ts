import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { id: invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    // Invoice header with related PO and supplier
    const headerResult = await client.sql`
      SELECT pi.id, pi.purchase_order_id, pi.receipt_date, pi.payment_amount, pi.payment_due_date, pi.payment_status, pi.created_at,
             po.invoice_number AS purchase_order_number, po.total_amount AS purchase_order_total, po.dp_amount AS purchase_order_dp,
             po.discount_amount AS purchase_order_discount_amount, po.tax_amount AS purchase_order_tax_amount,
             s.supplier_name
      FROM purchase_invoices pi
      LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE pi.id = ${invoiceId}
      LIMIT 1
    `;

    const invoice = headerResult.rows[0];
    if (!invoice) {
      return NextResponse.json({ message: 'Purchase invoice not found' }, { status: 404 });
    }

    // Invoice items joined to purchase_order_details and raw_material
    const itemsResult = await client.sql`
      SELECT
        pii.id AS purchase_invoice_item_id,
        pii.purchase_order_detail_id,
        pii.quantity_received,
        pod.quantity AS ordered_quantity,
        pod.unit_price AS ordered_unit_price,
        rm.id AS raw_material_id,
        rm.material_name,
        rm.sku,
        rm.unit_name
      FROM purchase_invoice_items pii
      LEFT JOIN purchase_order_details pod ON pii.purchase_order_detail_id = pod.id
      LEFT JOIN raw_material rm ON pod.raw_material_id = rm.id
      WHERE pii.purchase_invoice_id = ${invoiceId}
    `;

    invoice.items = itemsResult.rows;

    return NextResponse.json({ data: invoice }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/SP/purchase-invoice/show error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
