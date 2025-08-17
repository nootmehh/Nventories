import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { id: invoiceId } = await context.params;

    if (!invoiceId) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    try {
      await client.query('BEGIN');

      const { rows: invRows } = await client.sql`
        SELECT id, purchase_order_id FROM purchase_invoices WHERE id = ${invoiceId} LIMIT 1
      `;
      const invoice = invRows[0];
      if (!invoice) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Purchase invoice not found' }, { status: 404 });
      }

      // If there are business rules that prevent deleting invoices (e.g., linked payments or stock movements), check them here.
      // For now, remove invoice items then the invoice itself.

      await client.sql`
        DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = ${invoiceId}
      `;

      const { rowCount } = await client.sql`
        DELETE FROM purchase_invoices WHERE id = ${invoiceId}
      `;

      await client.query('COMMIT');

      if (rowCount === 0) {
        return NextResponse.json({ message: 'Purchase invoice not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Purchase invoice deleted successfully.' }, { status: 200 });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      console.error('Transaction error while deleting purchase invoice:', txErr);
      return NextResponse.json({ message: txErr?.message || 'Failed to delete purchase invoice' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /outlets/SP/purchase-invoice/delete error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.error('Error closing DB client:', e);
    }
  }
}
