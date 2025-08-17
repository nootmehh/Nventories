import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });

  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId') || '';
    const searchQuery = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status') || '';

    if (!outletId.trim()) {
      return NextResponse.json(
        { message: 'Outlet ID is required' },
        { status: 400 }
      );
    }

    await client.connect();

    let query = `
      SELECT 
        pi.id, 
        pi.receipt_date, 
        pi.payment_amount, 
        pi.payment_status,
        pi.payment_due_date,
        po.invoice_number, 
        po.total_amount, 
        po.dp_amount,
        s.supplier_name
      FROM purchase_invoices pi
      LEFT JOIN purchase_orders po ON pi.purchase_order_id = po.id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.outlet_id = $1
    `;
    const values: any[] = [outletId];

    if (searchQuery.trim()) {
      query += ` AND po.invoice_number ILIKE $${values.length + 1}`;
      values.push(`%${searchQuery}%`);
    }

    if (statusFilter.trim() && statusFilter !== 'All status') {
      query += ` AND pi.payment_status = $${values.length + 1}`;
      values.push(statusFilter);
    }

    query += ' ORDER BY pi.receipt_date DESC';

    const result = await client.query(query, values);

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('API /outlets/SP/purchase-invoice/list error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
