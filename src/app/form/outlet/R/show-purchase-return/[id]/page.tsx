'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CustomButton } from '@/components/ui/customButton';
import { CustomInput } from '@/components/ui/input';
import EmptyStateTable from '@/components/EmptyStateTable';

import { Eye, Trash } from 'lucide-react';

export default function ShowPurchaseReturnPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/outlets/R/purchase-return/show/${id}`);
        const body = await res.json();
        if (res.ok) setData(body.data);
        else alert(body.message || 'Failed to load');
      } catch (e) { console.error('fetch show return', e); alert('Connection error'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <EmptyStateTable title="Not found" orangeDesc="No data" description="Purchase return not found" />;

  const header = data.header;
  const details = data.details || [];
  const subtotal = details.reduce((s: number, d: any) => s + Number(d.total_value_return || 0), 0);
  const total = subtotal; // currently no discount/tax on return; mirror if needed later

  const handleDelete = async () => {
    if (!confirm('Delete this purchase return? This will restore stock.')) return;
    try {
      const res = await fetch('/api/outlets/R/purchase-return/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: header.id })
      });
      const body = await res.json();
      if (res.ok) {
        alert('Deleted');
        router.push('/outlet/R/purchase-return');
      } else alert(body.message || 'Delete failed');
    } catch (e) { console.error(e); alert('Connection error'); }
  };

  return (
    <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
      <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-lg">Purchase Return #{header.return_number}</h1>
            <div className="text-sm text-grey-desc">Date: {new Date(header.return_date).toLocaleDateString()}</div>
            <div className="text-sm text-grey-desc">Supplier: {header.supplier_name || '-'}</div>
          </div>
          <div className="flex gap-3">
            <CustomButton variant="primary" onClick={() => router.back()}>Back</CustomButton>
          </div>
        </div>

        <div className="self-stretch border-t border-white-3"></div>

        <div>
          <h2 className="font-medium">Items</h2>
          {details.length === 0 ? (
            <div className="py-8 text-center text-grey-desc">No items in this return</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="bg-white-2 px-3 py-3 inline-flex gap-6 text-sm font-semibold uppercase text-grey-desc">
                <div className="min-w-6">No.</div>
                <div className="w-full">Product</div>
                <div className="w-full">Qty Returned</div>
                <div className="w-full">Unit</div>
                <div className="w-full">Unit Price (Rp)</div>
                <div className="w-full">Total (Rp)</div>
              </div>
              {details.map((d: any, idx: number) => (
                <div key={d.id} className="px-3 py-3 inline-flex gap-6 items-center border-b border-white-3 text-sm text-grey-2">
                  <div className="min-w-6">{idx + 1}.</div>
                  <div className="w-full">{d.material_name}</div>
                  <div className="w-full">{d.quantity_returned}</div>
                  <div className="w-full">{d.unit_name}</div>
                  <div className="w-full">Rp {Number(d.unit_price_return).toLocaleString('id-ID')}</div>
                  <div className="w-full">Rp {Number(d.total_value_return).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="self-stretch border-t border-white-3"></div>
        <div className="flex justify-end gap-4">
          <div className="text-sm text-grey-desc">Subtotal</div>
          <div className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</div>
        </div>
        <div className="flex justify-end gap-4">
          <div className="text-sm text-grey-desc">Total</div>
          <div className="font-semibold">Rp {total.toLocaleString('id-ID')}</div>
        </div>

      </div>
    </div>
  );
}
