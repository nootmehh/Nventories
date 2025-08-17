'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import EmptyStateTable from "@/components/EmptyStateTable";
import Pagination from "@/components/pagination";
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
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function StockInPage() {
    const { user, allOutlets } = useUser();
        const params = useParams();
        const router = useRouter();
        const outletId = params.id as string;

    const [outletFilter, setOutletFilter] = useState('');
    const [stockIns, setStockIns] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    const outletFilterOptions = [
    { label: 'Filters', value: 'Filters' },
  ];

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!outletId) return;
        const fetchList = async () => {
            setLoadingList(true);
            try {
                const res = await fetch(`/api/outlets/SP/stock-in/list?outletId=${outletId}`);
                const body = await res.json();
                if (res.ok) setStockIns(body.data || []);
            } catch (e) { console.error(e); }
            finally { setLoadingList(false); }
        };
        fetchList();
    }, [outletId]);

    async function handleDeleteStockIn(id: string) {
        if (!confirm('Delete this stock in record?')) return;
        try {
            const res = await fetch(`/api/outlets/SP/stock-in/delete/${id}`, { method: 'DELETE' });
            const body = await res.json();
            if (!res.ok) { alert(body.message || 'Failed to delete'); return; }
            // remove from state
            setStockIns(prev => prev.filter(s => String(s.stock_in_id) !== String(id)));
            alert('Deleted');
        } catch (e) {
            console.error('Delete failed', e);
            alert('Connection error');
        }
    }

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full ">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                            Stock In List<span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                            Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/form/outlet/SP/add-stock-in/${outletId}`}>
                                <CustomButton
                                    variant="primary"
                                    size="lg"
                                    iconPlacement="right"
                                    Icon={Plus}
                                >
                                    Add stock in
                                </CustomButton>
                            </Link>
                        </div> 
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search stock in by name"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                        />

                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc justify-start text-sm font-semibold uppercase">
                            <div className="min-w-6">
                                No.
                            </div>
                            <div className="min-w-40 ">
                                Date
                            </div>
                            <div className="w-full">
                                Supplier
                            </div>
                            <div className="w-full">
                                Product
                            </div>
                            <div className="w-full">
                                Quantity
                            </div>
                            <div className="w-full">
                                Unit
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Details
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Delete
                            </div>
                        </div>
                        {/* Table rows */}
                        {loadingList ? (
                            <div className="w-full text-center py-8 text-grey-desc font-medium">Loading...</div>
                        ) : stockIns.length === 0 ? (
                            <EmptyStateTable
                                title="There is no stock in list"
                                orangeDesc="Add stock in"
                                description="to add stock in list."
                            />
                        ) : (
                            stockIns.map((row, index) => (
                                <div key={row.stock_in_id} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-6">{index + 1}.</div>
                                    <div className="min-w-40">{row.received_date ? new Date(row.received_date).toLocaleDateString() : '-'}</div>
                                    <div className="w-full">{row.supplier_name || '-'}</div>
                                    <div className="w-full">{row.material_name}</div>
                                    <div className="w-full">{row.quantity_in}</div>
                                    <div className="w-full">{row.unit_name}</div>
                                    <div className="min-w-15 flex justify-center">
                                        <Link href={`/form/outlet/SP/show-stock-in/${row.stock_in_id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Eye} />
                                        </Link>
                                    </div>
                                    <div className="min-w-15 flex justify-center">
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeleteStockIn(row.stock_in_id)}/>
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