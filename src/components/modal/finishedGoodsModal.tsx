'use client';

import React, { useState, useEffect } from 'react';
import { CustomInput } from '@/components/ui/input';
import { X, Search, Check } from 'lucide-react';
import { CustomButton } from '@/components/ui/customButton';

interface FinishedGood {
  id: number;
  sku: string;
  product_name: string;
  unit_name: string;
  remaining_stock?: number;
  price_per_unit?: number;
}

interface FinishedGoodsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  outletId: string;
  // when true, allow selection and return selected items via onSaveAction
  isSelectable?: boolean;
  onSaveAction?: (selected: FinishedGood[]) => void;
}

export default function FinishedGoodsModal({ isOpen, onCloseAction, outletId, isSelectable = false, onSaveAction }: FinishedGoodsModalProps) {
  const [items, setItems] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchFinished = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('outletId', outletId);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/outlets/MS/finished-goods/list?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        // API returns an array
        const rows = Array.isArray(data) ? data : [];
        setItems(rows.map((r: any) => ({
          id: r.id,
          sku: r.sku,
          product_name: r.product_name,
          unit_name: r.unit_name,
          remaining_stock: r.remaining_stock != null ? Number(r.remaining_stock) : undefined,
          price_per_unit: r.price_per_unit != null ? Number(r.price_per_unit) : undefined,
        })));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch finished goods', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchFinished();
  }, [isOpen, searchQuery, outletId]);

  const formatPrice = (price?: number) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-blue">Finished Goods</h2>
          <CustomButton variant="ghost" size="smallIcon" onClick={onCloseAction} Icon={X} />
        </div>

        <div className="mb-4">
          <CustomInput
            placeholder="Search finished goods"
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft={<Search className="h-5 w-5 text-gray-400" />}
          />
        </div>

        <div className="overflow-x-auto">
          <div className="bg-white-2 px-3 py-3 self-stretch w-full border-1 border-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
            <div className="w-full">SKU</div>
            <div className="w-full">Product</div>
            <div className="w-full">Unit</div>
            <div className="w-full">Remaining stock</div>
            <div className="w-full">Cost per unit (Rp)</div>
            <div className="min-w-5"></div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 font-medium text-grey-desc">Loading...</div>
            ) : items.length > 0 ? (
              items.map((it) => {
                const isSel = selected.has(it.id);
                return (
                <div key={it.id} className="px-3 py-4 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                  <div className="w-full">{it.sku}</div>
                  <div className="w-full">{it.product_name}</div>
                  <div className="w-full">{it.unit_name}</div>
                  <div className="w-full">{it.remaining_stock != null ? it.remaining_stock : '-'}</div>
                  <div className="w-full">{formatPrice(it.price_per_unit)}</div>
                  {isSelectable ? (
                    <div className="w-5 flex items-center justify-center relative">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => {
                          setSelected(prev => {
                            const copy = new Set(prev);
                            if (copy.has(it.id)) copy.delete(it.id); else copy.add(it.id);
                            return copy;
                          });
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span
                        className={`w-5 h-5 flex items-center justify-center transition-colors rounded-sm duration-150 ${
                          isSel ? 'bg-primary-orange' : 'bg-transparent border-1 border-grey-2'
                        }`}
                      >
                        {isSel && <Check size={14} className="text-white-1" />}
                      </span>
                    </div>
                  ) : (<div className='min-w-5'></div>)}
                </div>
              )})
            ) : (
              <div className="text-center py-8">No finished goods found.</div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <CustomButton variant="ghost" onClick={onCloseAction}>Close</CustomButton>
          {isSelectable ? (
            <CustomButton variant="primary" onClick={() => {
              const selectedArr = items.filter(it => selected.has(it.id));
              if (onSaveAction) onSaveAction(selectedArr);
              onCloseAction();
            }}>Save</CustomButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
