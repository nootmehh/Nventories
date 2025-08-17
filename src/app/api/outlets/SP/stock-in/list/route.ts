import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const url = new URL(request.url);
    const outletId = url.searchParams.get('outletId');

    const baseSelect = `
      SELECT si.id as stock_in_id,
             si.quantity_in,
             si.total_value,
             si.received_date,
             si.image_urls,
             pii.purchase_invoice_id,
             po.invoice_number,
             rm.material_name,
             rm.unit_name,
             s.supplier_name
      FROM stock_in si
      JOIN purchase_invoice_items pii ON pii.id = si.purchase_invoice_item_id
      JOIN purchase_invoices pi ON pi.id = pii.purchase_invoice_id
      JOIN purchase_orders po ON po.id = pi.purchase_order_id
      JOIN purchase_order_details pod ON pod.id = pii.purchase_order_detail_id
      JOIN raw_material rm ON rm.id = pod.raw_material_id
      LEFT JOIN suppliers s ON s.id = po.supplier_id
    `;

    let result;
    if (outletId) {
      result = await client.query(`${baseSelect} WHERE po.outlet_id = $1 ORDER BY si.received_date DESC NULLS LAST, si.id DESC`, [outletId]);
    } else {
      result = await client.query(`${baseSelect} ORDER BY si.received_date DESC NULLS LAST, si.id DESC`);
    }

    const rows = (result && (result as any).rows) ? (result as any).rows : [];
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: any) {
    console.error('stock-in list error', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  } finally {
    try { await client.end(); } catch {}
  }
}
