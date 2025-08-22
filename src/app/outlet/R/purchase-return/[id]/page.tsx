'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import EmptyStateTable from "@/components/EmptyStateTable";
import Pagination from "@/components/Pagination";
import "@/app/globals.css";

import {
  Plus,
  ChevronDown,
  Pencil,
  Search,
  Download
} from 'lucide-react';
import { Eye, Trash } from 'lucide-react';
import Link from "next/link";

export default function PurchaseReturnPage() {

    const params = useParams();
        const outletId = params.id as string;
        const { allOutlets } = useUser();
        const router = useRouter();

    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!outletId) return;
        const fetchList = async () => {
            try {
                const res = await fetch(`/api/outlets/R/purchase-return/list?outletId=${outletId}`);
                const body = await res.json();
                if (res.ok) setList(body.data || []);
                else console.error('Failed fetching returns', body);
            } catch (e) { console.error('fetch returns', e); }
            finally { setLoading(false); }
        };
        fetchList();
    }, [outletId]);

    const handleView = (id: number | string) => {
        router.push(`/outlet/R/purchase-return/${id}`);
    };

    const handleDeleteReturn = async (id: number | string) => {
        if (!confirm('Delete this purchase return? This will restore remaining_stock.')) return;
        try {
            const res = await fetch('/api/outlets/R/purchase-return/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Delete failed');
            // remove from list client-side
            setList(prev => prev.filter(item => String(item.id) !== String(id)));
            alert(body.message || 'Deleted');
        } catch (err: any) {
            console.error('Delete failed', err);
            alert(err?.message || 'Failed to delete');
        }
    };

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full ">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                            Purchase Return List
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                            Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                        <Link href={`/form/outlet/R/add-purchase-return/${outletId}`}>
                            <CustomButton
                            variant="primary"
                            size="lg"
                            iconPlacement="right"
                            Icon={Plus}
                            >
                            Add purchase return    
                            </CustomButton>
                        </Link>
                        </div>
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search return no."
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center text-sm font-semibold uppercase justify-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start ">
                                No.
                            </div>
                            <div className="w-full">
                                Date
                            </div>
                             <div className="w-full">
                                Supplier
                            </div>
                            <div className="w-full">
                                Return No.
                            </div>
                            <div className="w-full">
                                Value Return
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Details
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Delete
                            </div>
                        </div>
                        {/* Rows */}
                        {loading ? (
                            <div className="w-full py-8 text-center font-medium text-grey-desc">Loading...</div>
                        ) : list.length === 0 ? (
                            <EmptyStateTable
                                title="Table is empty"
                                orangeDesc="Add list"
                                description="to add purchase return list."
                            />
                        ) : (
                            list.map((r: any, idx: number) => (
                                <div key={r.id} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-6">{idx + 1}.</div>
                                    <div className="w-full">{new Date(r.return_date).toLocaleDateString()}</div>
                                    <div className="w-full">{r.supplier_name || '-'}</div>
                                    <div className="w-full">{r.return_number || '-'}</div>
                                    <div className="w-full">Rp {new Intl.NumberFormat('id-ID').format(Math.round(Number(r.total_value || 0)))}</div>
                                    <div className="min-w-15 flex justify-center">
                                        <Link href={`/form/outlet/R/show-purchase-return/${r.id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Eye} />
                                        </Link>
                                    </div>
                                    <div className="min-w-15 flex justify-center">
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeleteReturn(r.id)}/>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}