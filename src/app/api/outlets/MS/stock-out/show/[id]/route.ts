import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const client = createClient({ connectionString: process.env.POSTGRES_URL });
  await client.connect();
  try {
    const pathname = new URL(request.url).pathname;
    const idStr = pathname.split('/').pop();
    if (!idStr) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ message: 'Invalid id' }, { status: 400 });

    const q = await client.sql`SELECT id, stock_out_number, transaction_date, image_urls, outlet_id FROM stock_out WHERE id = ${id} LIMIT 1`;
    const row = (q as any).rows && (q as any).rows[0] ? (q as any).rows[0] : null;
    if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const stockOutNumber = row.stock_out_number;
    const outletId = row.outlet_id;

    const itemsQ = await client.sql`
      SELECT so.id as stock_out_id, so.quantity_out, so.image_urls as image_urls, fg.id as finished_good_id, fg.product_name, fg.unit_name, fg.price_per_unit
      FROM stock_out so
      LEFT JOIN finished_goods fg ON fg.id = so.finished_good_id
      WHERE so.stock_out_number = ${stockOutNumber} AND so.outlet_id = ${outletId}
      ORDER BY so.id
    `;

    const items = (itemsQ as any).rows || [];

    // collect images from the main row and each item (image_urls may be stored as JSON string)
    const allImages: string[] = [];
    const pushImages = (val: any) => {
      if (!val) return;
      try {
        if (typeof val === 'string') {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) parsed.forEach((u) => allImages.push(String(u)));
        } else if (Array.isArray(val)) {
          val.forEach((u) => allImages.push(String(u)));
        }
      } catch (e) {
        // not JSON; skip or push if it's a single URL string
        if (typeof val === 'string' && val.trim()) allImages.push(val);
      }
    };

    pushImages(row.image_urls);
    for (const it of items) pushImages(it.image_urls);

    // dedupe
    const images = Array.from(new Set(allImages)).filter(Boolean);

    return NextResponse.json({ data: { stock_out_number: stockOutNumber, transaction_date: row.transaction_date, images, items } }, { status: 200 });
  } catch (err: any) {
    console.error('stock-out show error', err);
    return NextResponse.json({ message: err?.message || 'Failed' }, { status: 500 });
  } finally { try { await client.end(); } catch(e){ console.error(e); } }
}
