'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import EmptyStateTable from "@/components/EmptyStateTable";

import {
  Plus,
  Pencil,
  Search
} from 'lucide-react';

export default function SupplierListPage() {
    const { user, allOutlets } = useUser();
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;

    
    
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');

    // State untuk teks "All outlet" / "Showing result"
        const [hasActiveFilter, setHasActiveFilter] = useState(false);

     const truncateAddress = (address: string, maxLength: number) => {
        if (!address || address.length <= maxLength) return address;
        return address.slice(0, maxLength) + '...';
    };

    const fetchSuppliers = async () => {
    setLoading(true);
    if (!user?.business?.id || !outletId) {
      router.push('/outlet');
      return;
    }

    try {
        const response = await fetch(
            `/api/outlets/suppliers/list?outletId=${outletId}&q=${encodeURIComponent(searchQuery)}`
        );
        const result = await response.json();

        if (response.ok) {
            setSuppliers(result.data);
        } else {
            console.error("Failed to fetch suppliers:", result.message);
            setSuppliers([]);
        }
    } catch (error) {
        console.error("Connection error while fetching suppliers:", error);
        setSuppliers([]);
    } finally {
        setLoading(false);
    }
};


    useEffect(() => {
    if (outletId && user?.business?.id) {
         fetchSuppliers();
    }
 }, [outletId, user?.business?.id, searchQuery]);

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);
    
    if (user?.role === 'Employee') {
        return (
            <div className="w-full text-center p-8">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }
    
    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                                Supplier List <span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                                Show all
                            </p>
                        </div>
                        <Link href={`/form/outlet/add-supplier/${outletId}`}>
                            <CustomButton
                                variant="primary"
                                size="lg"
                                iconPlacement="right"
                                Icon={Plus}
                            >
                                Add Supplier
                            </CustomButton>
                        </Link>             
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search supplier"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-[2px]">
                        {/* Header Tabel */}
                        <div className="bg-white-2 px-3 py-4 w-full border-1 border-white-3 inline-flex items-center justif-start gap-6 text-grey-desc font-semibold uppercase text-sm">
                            <div className="min-w-6">No.</div>
                            <div className="w-full">Supplier Code</div>
                            <div className="w-full">Supplier Name</div>
                            <div className="w-full">Address</div>
                            <div className="w-full">Phone No.</div>
                            <div className="w-full">Email</div>
                            <div className="w-full">Description</div>
                            <div className="collapse">
                                <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} />
                            </div>
                        </div>
                        {/* Konten Tabel */}
                        {loading ? (
                            <div className="w-full text-center py-8 text-grey-desc">Loading suppliers...</div>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((supplier, index) => (
                                <div key={supplier.id} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 font-medium text-sm">
                                    <div className="min-w-6">{index + 1}.</div>
                                    <div className="w-full">{supplier.supplier_code}</div>
                                    <div className="w-full">{supplier.supplier_name}</div>
                                    <div className="w-full">{supplier.address}</div>
                                    <div className="w-full">{supplier.phone_number}</div>
                                    <div className="w-full">{supplier.email}</div>
                                    <div className="w-full">{supplier.description}</div>
                                    <div className="flex justify-end">
                                        {user?.role !== 'Employee' && (
                                            <Link href={`/form/outlet/edit-supplier/${supplier.id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} />
                                            </Link>                          
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyStateTable
                                title="No suppliers found"
                                orangeDesc="Add supplier"
                                description=" to create supplier list."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}