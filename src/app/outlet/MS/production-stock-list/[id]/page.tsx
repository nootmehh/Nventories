 'use client';

import { useState, useEffect } from "react";
import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import EmptyStateTable from "@/components/EmptyStateTable";
import "@/app/globals.css";

import {
  Plus,
  Eye,
  Pencil,
  Search,
  Download
} from 'lucide-react';
import Dropdown from "@/components/ui/dropdown";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FinishedGoodsModal from '@/components/modal/finishedGoodsModal';

export default function ProductionStockPage() {
    
    const { user, allOutlets } = useUser();
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;

    const [outletFilter, setOutletFilter] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFinishedModal, setShowFinishedModal] = useState(false);

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);

    useEffect(() => {
      if (!outletId) return;
      const abortController = new AbortController();
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/outlets/MS/stock-production/list?outletId=${encodeURIComponent(outletId)}`, {
            method: 'GET',
            signal: abortController.signal,
            headers: { 'Accept': 'application/json' }
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json?.error || `Request failed: ${res.status}`);
          }
          const data = await res.json();
          setItems(Array.isArray(data) ? data : []);
        } catch (err: any) {
          if (!abortController.signal.aborted) {
            setError(err?.message ?? 'Failed to load data');
            setItems([]);
          }
        } finally {
          if (!abortController.signal.aborted) setLoading(false);
        }
      }
      load();
      return () => abortController.abort();
    }, [outletId]);

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full ">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                            Production Stock List <span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                            Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/form/outlet/MS/add-production-stock/${outletId}`}>
                            <CustomButton
                            variant="primary"
                            size="lg"
                            iconPlacement="right"
                            Icon={Plus}
                            >
                            Add production stock      
                            </CustomButton>
                            </Link>
                        </div> 
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search production stock"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                        />

                        <CustomButton
                        className="w-40"
                        variant={'outline'}
                        size={'md'}
                        iconPlacement="right"
                        Icon={Eye}
                        onClick={() => setShowFinishedModal(true)}
                        >Goods list</CustomButton>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table Header */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start text-sm font-semibold uppercase gap-6 text-grey-desc">
                            <div className="min-w-6">
                                No.
                            </div>
                            <div className="w-full">
                                Date
                            </div>
                            <div className="w-full">
                                SKU
                            </div>
                             <div className="w-full">
                                Source stock
                            </div>
                            <div className="w-full">
                                Output stock
                            </div>
                            <div className="w-full">
                                Amount produced
                            </div>
                        </div>

                        {/* Table Body / Empty State */}
                        {loading ? (
                          <div className="p-6 text-center text-sm text-grey-desc font-medium">Loading...</div>
                        ) : error ? (
                          <div className="p-6 text-center text-sm text-red-600">{error}</div>
                        ) : items.length === 0 ? (
                          <EmptyStateTable
                            title="Table is empty"
                            orangeDesc="Add production stock"
                            description="to add production stock list."
                          />
                        ) : (
                          <div className="w-full flex flex-col divide-y">
                            {items.map((it, idx) => {
                                const date = it.production_date ? new Date(it.production_date).toLocaleDateString() : '-';
                                // Normalize raw materials into a readable comma-separated string:
                                const rawMaterialsList = Array.isArray(it.raw_materials)
                                  ? it.raw_materials.map((r: any) => String(r).trim()).filter(Boolean)
                                  : (typeof it.raw_materials === 'string'
                                    ? it.raw_materials.split(',').map((s: string) => s.trim()).filter(Boolean)
                                    : []);
                                const rawMaterials = rawMaterialsList.length
                                  ? rawMaterialsList.join(', ')
                                  : (it.source_stock ? String(it.source_stock) : '-');
                                const finishedGoodName = it.product_name ?? it.sku ?? '-';
                                const quantityBeingProduced = it.quantity_produced ?? '-';

                                return (
                                    <div key={it.id ?? idx} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 font-medium text-sm">
                                    <div className="min-w-6">{idx + 1}</div>
                                    <div className="w-full">{date}</div>
                                    <div className="w-full">{it.sku ?? '-'}</div>
                                    <div className="w-full">{rawMaterials}</div>
                                    <div className="w-full">{finishedGoodName}</div>
                                    <div className="w-full">{quantityBeingProduced}</div>
                                    </div>
                                );
                                })}
                          </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Finished Goods Modal placed as a child of the root wrapper */}
            <FinishedGoodsModal isOpen={showFinishedModal} onCloseAction={() => setShowFinishedModal(false)} outletId={outletId} />
        </div>
    );
}
//