import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

    // header
    const header = await client.sql`
      SELECT pr.id, pr.purchase_invoice_id, pr.return_number, pr.return_date, pr.reason, pr.created_at,
             pi.purchase_order_id, po.invoice_number AS purchase_order_number, s.supplier_name
      FROM purchase_returns pr
      LEFT JOIN purchase_invoices pi ON pi.id = pr.purchase_invoice_id
      LEFT JOIN purchase_orders po ON po.id = pi.purchase_order_id
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      WHERE pr.id = ${id}
      LIMIT 1
    `;

    const head = header.rows[0];
    if (!head) return NextResponse.json({ message: 'Purchase return not found' }, { status: 404 });

    const details = await client.sql`
      SELECT prd.id, prd.raw_material_id, prd.quantity_returned, prd.unit_price_return, prd.total_value_return,
             rm.material_name, rm.unit_name
      FROM purchase_return_details prd
      LEFT JOIN raw_material rm ON rm.id = prd.raw_material_id
      WHERE prd.purchase_return_id = ${id}
    `;

    return NextResponse.json({ data: { header: head, details: details.rows } }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching purchase_return show', err);
    return NextResponse.json({ message: err?.message || 'Internal server error' }, { status: 500 });
  } finally {
    try { await client.end(); } catch (e) { console.error(e); }
  }
}
