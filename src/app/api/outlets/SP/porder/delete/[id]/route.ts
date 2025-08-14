import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();

  try {
    const { id: orderId } = await context.params; // <-- pakai await di sini

    if (!orderId) {
      return NextResponse.json(
        { message: 'Purchase Order ID is required' },
        { status: 400 }
      );
    }

    const result = await client.sql`
      DELETE FROM purchase_orders WHERE id = ${orderId}
    `;

    await client.end();

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Purchase order deleted successfully.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('API /outlets/SP/porder/delete error:', error);
    await client.end();
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
