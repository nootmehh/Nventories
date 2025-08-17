'use client';

import { useState } from "react";
import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import EmptyStateTable from "@/components/EmptyStateTable";
import "@/app/globals.css";

import {
  Plus,
  Pencil,
  Search,
  Download
} from 'lucide-react';
import Dropdown from "@/components/ui/dropdown";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProductionStockPage() {
    
    const { user, allOutlets } = useUser();
        const params = useParams();
        const router = useRouter();
        const outletId = params.id as string;

    const [outletFilter, setOutletFilter] = useState('');

    const outletFilterOptions = [
    { label: 'Filters', value: 'Filters' },
    { label: 'Open', value: 'Open' },
    { label: 'Closed', value: 'Closed' },
  ];

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);

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

                        {/* Dropdown */}
                        <Dropdown
                            className="w-64"
                            placeholder="Filters"
                            options={outletFilterOptions}
                            value={outletFilter}
                            onChange={setOutletFilter}
                            />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start text-sm font-semibold uppercase gap-6 text-grey-desc">
                            <div className="min-w-6">
                                No.
                            </div>
                            <div className="w-full">
                                Date
                            </div>
                            <div className="w-full self-stretch">
                                SKU
                            </div>
                             <div className="w-full self-stretch">
                                Source stock
                            </div>
                            <div className="w-full self-stretch">
                                Output stock
                            </div>
                            <div className="w-full self-stretch">
                                status
                            </div>
                            <div className="invisible">
                                <CustomButton
                                    variant="ghost"
                                    size="icon"
                                    className="hidden"
                                    Icon={Pencil}
                                />
                            </div>
                        </div>
                        {/* Empty State /Table */}
                        <EmptyStateTable
                            title="Table is empty"
                            orangeDesc="Add production stock"
                            description="to add production stock list."
                            />
                    </div>
                </div>
            </div>
        </div>
    );
}