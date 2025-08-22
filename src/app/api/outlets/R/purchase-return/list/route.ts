import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const url = new URL(request.url);
  const outletId = url.searchParams.get('outletId');
  const debug = url.searchParams.get('debug');

    // Basic validation
    if (!outletId) {
      return NextResponse.json({ message: 'outletId is required' }, { status: 400 });
    }

    // Get purchase_returns and aggregate total value from details
    let res;
    if (debug === '1') {
      // debug mode: return all purchase_returns so we can inspect linking
      res = await client.sql`
        SELECT pr.id, pr.return_number, pr.return_date, pr.reason, pr.purchase_invoice_id,
               COALESCE(s.supplier_name, '') AS supplier_name,
               COALESCE(SUM(prd.total_value_return), 0) AS total_value
        FROM purchase_returns pr
        LEFT JOIN purchase_return_details prd ON prd.purchase_return_id = pr.id
        LEFT JOIN purchase_invoices pi ON pi.id = pr.purchase_invoice_id
        LEFT JOIN purchase_orders po ON po.id = pi.purchase_order_id
        LEFT JOIN suppliers s ON s.id = po.supplier_id
        GROUP BY pr.id, s.supplier_name
        ORDER BY pr.return_date DESC, pr.id DESC
        LIMIT 1000
      `;
    } else {
      res = await client.sql`
        SELECT pr.id, pr.return_number, pr.return_date, pr.reason, pr.purchase_invoice_id,
               COALESCE(s.supplier_name, '') AS supplier_name,
               COALESCE(SUM(prd.total_value_return), 0) AS total_value
        FROM purchase_returns pr
        LEFT JOIN purchase_return_details prd ON prd.purchase_return_id = pr.id
        LEFT JOIN purchase_invoices pi ON pi.id = pr.purchase_invoice_id
        LEFT JOIN purchase_orders po ON po.id = pi.purchase_order_id
        LEFT JOIN suppliers s ON s.id = po.supplier_id
        WHERE po.outlet_id = ${outletId}
        GROUP BY pr.id, s.supplier_name
        ORDER BY pr.return_date DESC, pr.id DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ data: res.rows }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching purchase_return list', err);
    return NextResponse.json({ message: err?.message || 'Internal server error' }, { status: 500 });
  } finally {
    try { await client.end(); } catch (e) { console.error(e); }
  }
}
