export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vercel/postgres";

export async function GET(request: NextRequest) {
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
      SELECT id, sku, product_name, unit_name, remaining_stock, price_per_unit, initial_stock
      FROM finished_goods
      WHERE outlet_id = ${Number(outletId)}
      ORDER BY product_name ASC
    `;

    return NextResponse.json(result.rows ?? []);
  } catch (err: any) {
    console.error("finished-goods list error", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  } finally {
    try { await client.end(); } catch (_) { /* ignore close errors */ }
  }
}
