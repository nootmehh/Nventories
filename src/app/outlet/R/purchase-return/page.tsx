'use client';

import Image from "next/image";
import { useState } from "react";

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
import Dropdown from "@/components/ui/dropdown";

export default function PurchaseReturnPage() {

    const [outletFilter, setOutletFilter] = useState('');

    const outletFilterOptions = [
    { label: 'Filters', value: 'Filters' },
    { label: 'Open', value: 'Open' },
    { label: 'Closed', value: 'Closed' },
  ];

    const [isOpen, setIsOpen] = useState(false);

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
                            <CustomButton
                            variant="primary"
                            size="lg"
                            iconPlacement="right"
                            Icon={Plus}
                            >
                            Add List    
                            </CustomButton>
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
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start text-sm font-semibold uppercase items-center">
                                No.
                            </div>
                            <div className="min-w-30 justify-start text-sm font-semibold uppercase">
                                Date
                            </div>
                             <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Supplier
                            </div>
                            <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Return No.
                            </div>
                            <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Total Amount
                            </div>
                            <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Remaining Amount
                            </div><div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Process
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
                            orangeDesc="Add list"
                            description="to add purchase return list."
                            />
                    </div>
                </div>
            </div>
        </div>
    );
}