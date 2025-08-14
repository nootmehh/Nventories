import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Next.js 13 async params
) {
  try {
    const { id: materialId } = await context.params; // ⚠️ harus di-await

    if (!materialId) {
      return NextResponse.json({ message: 'Raw Material ID is required' }, { status: 400 });
    }

    const client = createClient({
      connectionString: process.env.POSTGRES_URL, // wajib ada
    });
    await client.connect();

    const result = await client.sql`
      SELECT 
        id, outlet_id, material_name, min_stock_reminder, unit_name, price_per_unit, sku, opening_stock, remaining_stock
      FROM raw_material
      WHERE id = ${materialId}
    `;

    await client.end();

    const rawMaterial = result.rows[0];

    if (!rawMaterial) {
      return NextResponse.json({ message: 'Raw material not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rawMaterial }, { status: 200 });

  } catch (error) {
    console.error('API /outlets/raw-material/edit error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
