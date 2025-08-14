import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ message: 'Purchase Order ID is required' }, { status: 400 });
    }

    // Ambil data pesanan utama
    const orderResult = await client.sql`
      SELECT
        po.id, po.invoice_number, po.order_date, po.total_amount, po.dp_amount, po.discount_amount, po.tax_amount,
        po.delivery_status, po.invoice_process, po.created_at,
        s.supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ${orderId}
    `;

    const purchaseOrder = orderResult.rows[0];

    if (!purchaseOrder) {
      return NextResponse.json({ message: 'Purchase order not found' }, { status: 404 });
    }

    // Ambil data detail produk
    const detailsResult = await client.sql`
      SELECT
        pod.quantity, pod.unit_price, pod.subtotal,
        rm.material_name, rm.unit_name, rm.sku
      FROM purchase_order_details pod
      LEFT JOIN raw_material rm ON pod.raw_material_id = rm.id
      WHERE pod.purchase_order_id = ${orderId}
    `;

    purchaseOrder.products = detailsResult.rows;

    return NextResponse.json({ data: purchaseOrder }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/SP/porder/show error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
