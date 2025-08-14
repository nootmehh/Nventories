import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({
    connectionString: process.env.POSTGRES_URL, // langsung pakai POSTGRES_URL
  });

  try {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');
    const searchQuery = searchParams.get('q');
    const statusFilter = searchParams.get('status');

    if (!outletId) {
      return NextResponse.json({ message: 'Outlet ID is required' }, { status: 400 });
    }

    await client.connect();

    let result;

    // Base query dan parameter array
    let query = `
      SELECT 
        po.id, po.invoice_number, po.order_date, po.total_amount, po.delivery_status, po.invoice_process,
        s.supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.outlet_id = $1
    `;
    let params: any[] = [outletId];
    let paramIndex = 2;

    if (searchQuery) {
      query += ` AND po.invoice_number ILIKE $${paramIndex++}`;
      params.push(`%${searchQuery}%`);
    }

    if (statusFilter && statusFilter !== 'All status') {
      query += ` AND po.delivery_status = $${paramIndex++}`;
      params.push(statusFilter);
    }

    query += ` ORDER BY po.order_date DESC`;

    result = await client.query(query, params);

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('API /outlets/SP/porder/list error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await client.end();
  }
}
