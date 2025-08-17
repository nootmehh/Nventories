import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ message: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

  const form = await request.formData();
  const files = form.getAll('files');
  const invoiceId = form.get('invoiceId') ? String(form.get('invoiceId')) : null;
    if (!files || files.length === 0) return NextResponse.json({ urls: [] });

  const supabase = createSupabaseClient(supabaseUrl, serviceKey);
    const bucket = 'inventory_img';
    const uploadedUrls: string[] = [];

    for (const f of files) {
      // f is a File from the web API
      // convert to buffer
  const file: any = f;
      const name = file.name || `upload-${Date.now()}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
  const folder = invoiceId ? `stock_in/${invoiceId}` : `stock_in`;
  const key = `${folder}/${Date.now()}_${name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(key, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadErr) {
        console.error('Upload error (server)', uploadErr);
        return NextResponse.json({ message: 'Failed to upload file', detail: uploadErr.message }, { status: 500 });
      }

      const urlObj = supabase.storage.from(bucket).getPublicUrl(key);
      const publicUrl = (urlObj as any)?.data?.publicUrl || (urlObj as any)?.publicUrl;
      uploadedUrls.push(publicUrl as string);
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
  } catch (err: any) {
    console.error('Server upload error', err);
    return NextResponse.json({ message: err?.message || 'Upload failed' }, { status: 500 });
  }
}
