import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { materialName, sku, unitName, pricePerUnit, minStockReminder } = await request.json();

    if (!id || !materialName || !sku || !unitName || !pricePerUnit) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Tambahkan connectionString langsung
    const client = createClient({
      connectionString: process.env.POSTGRES_URL as string
    });

    await client.connect();

    const result = await client.sql`
      UPDATE raw_material
      SET material_name = ${materialName},
          sku = ${sku},
          unit_name = ${unitName},
          price_per_unit = ${pricePerUnit},
          min_stock_reminder = ${minStockReminder}
      WHERE id = ${id}
      RETURNING id
    `;

    await client.end();

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Raw material not found or no changes made' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Raw material updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/MS/raw-material/update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
