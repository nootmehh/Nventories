import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { id: stockInId } = await params;
    if (!stockInId) return NextResponse.json({ message: 'stock_in id is required' }, { status: 400 });

    const q = await client.sql`
      SELECT si.id as stock_in_id,
             si.quantity_in,
             si.total_value,
             si.received_date,
             si.image_urls,
             pii.id as purchase_invoice_item_id,
             pii.purchase_invoice_id,
             pod.id as purchase_order_detail_id,
             rm.id as raw_material_id,
             rm.material_name,
             rm.unit_name,
             po.invoice_number,
             s.supplier_name
      FROM stock_in si
      JOIN purchase_invoice_items pii ON pii.id = si.purchase_invoice_item_id
      LEFT JOIN purchase_order_details pod ON pod.id = pii.purchase_order_detail_id
      LEFT JOIN raw_material rm ON rm.id = pod.raw_material_id
      LEFT JOIN purchase_invoices pi ON pi.id = pii.purchase_invoice_id
      LEFT JOIN purchase_orders po ON po.id = pi.purchase_order_id
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      WHERE si.id = ${stockInId}
      LIMIT 1
    `;

    const row = (q && (q as any).rows && (q as any).rows[0]) ? (q as any).rows[0] : null;
    if (!row) return NextResponse.json({ message: 'stock_in not found' }, { status: 404 });

    // image_urls may be stored as JSON text; normalize to array
    let images: string[] = [];
    try {
      if (!row.image_urls) images = [];
      else if (Array.isArray(row.image_urls)) images = row.image_urls;
      else if (typeof row.image_urls === 'string') images = JSON.parse(row.image_urls || '[]');
    } catch (err) { images = [] }

    row.image_urls = images;

    return NextResponse.json({ data: row }, { status: 200 });
  } catch (err: any) {
    console.error('API /outlets/SP/stock-in/show error:', err);
    return NextResponse.json({ message: err?.message || 'Internal server error' }, { status: 500 });
  } finally {
    try { await client.end(); } catch (e) { /* ignore */ }
  }
}
