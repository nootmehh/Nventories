import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const {
      outletId,
      materialName,
      sku,
      unitName,
      pricePerUnit,
      minStockReminder,
      openingStock
    } = await request.json();

    if (
      !outletId ||
      !materialName ||
      !sku ||
      !unitName ||
      pricePerUnit === undefined ||
      minStockReminder === undefined ||
      openingStock === undefined
    ) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // ✅ Gunakan connectionString dari env
    const client = createClient({
      connectionString: process.env.POSTGRES_URL,
    });
    await client.connect();

    const result = await client.sql`
      INSERT INTO raw_material (
        outlet_id, material_name, sku, unit_name,
        price_per_unit, min_stock_reminder, opening_stock, remaining_stock
      )
      VALUES (
        ${outletId}, ${materialName}, ${sku}, ${unitName},
        ${pricePerUnit}, ${minStockReminder}, ${openingStock}, ${openingStock}
      )
      RETURNING id
    `;

    await client.end();

    const newMaterialId = result.rows[0]?.id;

    return NextResponse.json(
      {
        message: 'Raw material created successfully.',
        id: newMaterialId,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('API /outlets/raw-material/create error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'SKU already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
