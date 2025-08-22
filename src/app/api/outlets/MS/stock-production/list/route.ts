// ...existing code...
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  // guard for connection string
  const connString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connString) {
    console.error("Missing DATABASE_URL / POSTGRES_URL environment variable");
    return NextResponse.json({ error: "Missing DATABASE_URL environment variable" }, { status: 500 });
  }

  const url = new URL(request.url);
  const outletId = url.searchParams.get("outletId");
  if (!outletId) {
    return NextResponse.json({ error: "Missing outletId" }, { status: 400 });
  }

  const client = createClient({ connectionString: connString });

  try {
    await client.connect();

    const result = await client.sql`
      SELECT
        pr.id,
        pr.production_date,
        pr.quantity_produced,
        fg.sku,
        fg.product_name,
        COALESCE(SUM(pm.quantity_used), 0) AS source_stock,
        -- aggregate raw material names (comma-separated). assumes raw_material.name exists
  COALESCE(string_agg(DISTINCT rm.material_name, ', '), '') AS raw_materials
      FROM production_runs pr
      LEFT JOIN finished_goods fg ON pr.finished_good_id = fg.id
      LEFT JOIN production_materials pm ON pm.production_run_id = pr.id
      LEFT JOIN raw_material rm ON pm.raw_material_id = rm.id
      WHERE pr.outlet_id = ${Number(outletId)}
      GROUP BY pr.id, pr.production_date, pr.quantity_produced, fg.sku, fg.product_name
      ORDER BY pr.production_date DESC
    `;

    return NextResponse.json(result.rows ?? []);
  } catch (err: any) {
    console.error("stock-production list error", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  } finally {
    try { await client.end(); } catch (_) { /* ignore close errors */ }
  }
}
// ...existing