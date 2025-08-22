'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
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
  Download,
  Eye,
  Trash
} from 'lucide-react';
import Dropdown from "@/components/ui/dropdown";
import Link from "next/link";

export default function StockOutPage() {

    const params = useParams();
    const outletId = params.id as string;
    const { allOutlets } = useUser();

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);

    const [outletFilter, setOutletFilter] = useState('');
    const [stockOuts, setStockOuts] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    const outletFilterOptions = [
    { label: 'Filters', value: 'Filters' },
    { label: 'Open', value: 'Open' },
    { label: 'Closed', value: 'Closed' },
  ];

    const [isOpen, setIsOpen] = useState(false);

    const fetchList = async () => {
        if (!outletId) return;
        setLoadingList(true);
        try {
            const res = await fetch(`/api/outlets/MS/stock-out/list?outletId=${outletId}`);
            const body = await res.json();
            if (res.ok) setStockOuts(body.data || []);
            else console.error('Failed to fetch stock outs', body);
        } catch (e) {
            console.error('Fetch stock outs error', e);
        } finally { setLoadingList(false); }
    };

    useEffect(() => { fetchList(); }, [outletId]);

    const handleDeleteStockOut = async (id: number) => {
        if (!confirm('Delete this stock out?')) return;
        try {
            const res = await fetch(`/api/outlets/MS/stock-out/delete/${id}`, { method: 'DELETE' });
            const body = await res.json();
            if (!res.ok) { alert(body.message || 'Delete failed'); }
            else { fetchList(); }
        } catch (e) { console.error('Delete failed', e); alert('Connection error'); }
    };

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full ">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                            Stock Out List
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                            Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                        <Link href={`/form/outlet/MS/add-stock-out/${outletId}`}>
                            <CustomButton
                            variant="primary"
                            size="lg"
                            iconPlacement="right"
                            Icon={Plus}
                            >
                            Add stock out       
                            </CustomButton>
                        </Link>
                        </div> 
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search stock out by name"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                        />

                        {/* Dropdown */}
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                            <div className="min-w-6 ">
                                No.
                            </div>
                            <div className="w-full ">
                                Date & Time
                            </div>
                            <div className="w-full ">
                                Stock out No.
                            </div>
                            <div className="w-full ">
                                Product Out
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Details
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Delete
                            </div>
                        </div>

                        {loadingList ? (
                            <div className="w-full text-center py-8 text-grey-desc font-medium">Loading...</div>
                        ) : stockOuts.length === 0 ? (
                            <EmptyStateTable
                                title="There is no stock out list"
                                orangeDesc="Add stock out"
                                description="to add stock out list."
                            />
                        ) : (
                            stockOuts.map((row, index) => (
                                <div key={row.stock_out_id} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-6">{index + 1}.</div>
                                    <div className="w-full">{row.out_date ? new Date(row.out_date).toLocaleString() : '-'}</div>
                                    <div className="w-full">{row.stock_out_no || '-'}</div>
                                    <div className="w-full">{row.product_list || '-'}</div>
                                    <div className="min-w-15 flex justify-center">
                                        <Link href={`/form/outlet/MS/show-stock-out/${row.stock_out_id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Eye} />
                                        </Link>
                                    </div>
                                    <div className="min-w-15 flex justify-center">
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeleteStockOut(row.stock_out_id)}/>
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