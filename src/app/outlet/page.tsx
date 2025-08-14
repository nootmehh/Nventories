'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from "@/components/ui/dropdown";
import EmptyStateTable from "@/components/EmptyStateTable";

import {
  Plus,
  Pencil,
  Search
} from 'lucide-react';

export default function OutletPage() {
    const { user } = useUser();
    const [outlets, setOutlets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // State untuk pencarian dan filter
    const [searchQuery, setSearchQuery] = useState('');
    const [outletStatusFilter, setOutletStatusFilter] = useState('All status');
    
    // State untuk teks "All outlet" / "Showing result"
    const [hasActiveFilter, setHasActiveFilter] = useState(false);

    const outletFilterOptions = [
        { label: 'All status', value: 'All status' },
        { label: 'Open', value: 'Open' },
        { label: 'Close', value: 'Close' },
    ];
    
    const truncateAddress = (address: string, maxLength: number) => {
        if (!address || address.length <= maxLength) return address;
        return address.slice(0, maxLength) + '...';
    };

    const fetchOutlets = async () => {
        setLoading(true);
        if (!user?.business?.id) {
            setLoading(false);
            return;
        }

        // Tentukan apakah ada filter yang aktif
        const hasFilter = searchQuery.length > 0 || outletStatusFilter !== 'All status';
        setHasActiveFilter(hasFilter);

        // Bangun URL dengan parameter filter
        const params = new URLSearchParams();
        params.append('businessId', user.business.id.toString());
        if (searchQuery) params.append('search', searchQuery);
        if (outletStatusFilter !== 'All status') params.append('status', outletStatusFilter);
        
        try {
            const response = await fetch(`/api/outlets/list?${params.toString()}`);
            const result = await response.json();
            
            if (response.ok) {
                setOutlets(result.data);
            } else {
                console.error("Failed to fetch outlets:", result.message);
                setOutlets([]);
            }
        } catch (error) {
            console.error("Connection error while fetching outlets:", error);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, [user?.business?.id, searchQuery, outletStatusFilter]); // Panggil fetchData saat filter berubah

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                                Outlet list <span className="text-grey-desc font-medium">| {user?.business?.businessName || 'Business Name'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                                {hasActiveFilter ? 'Showing result' : 'All outlet'}
                            </p>
                        </div>
                        <Link href="/form/outlet/add-outlet">
                            <CustomButton
                                variant="primary"
                                size="lg"
                                iconPlacement="right"
                                Icon={Plus}
                            >
                                Add outlet
                            </CustomButton>
                        </Link>
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search by name"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Dropdown
                            className="w-64"
                            placeholder="All status"
                            options={outletFilterOptions}
                            value={outletStatusFilter}
                            onChange={setOutletStatusFilter}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-[2px]">
                        {/* Header Tabel */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start text-sm font-semibold uppercase items-center">No.</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Outlet Name</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Address</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">City</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Manager</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Status</div>
                            <div className="collapse">
                                <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} />
                            </div>
                        </div>

                        {/* Konten Tabel */}
                        {loading ? (
                            <div className="w-full text-center py-8 text-grey-desc">Loading data...</div>
                        ) : outlets.length > 0 ? (
                            outlets.map((outlet, index) => (
                                <div key={outlet.id} className="px-3 py-4 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2">
                                    <div className="min-w-6 justify-start text-sm font-medium items-center">{index + 1}.</div>
                                    <div className="w-full justify-start text-sm font-medium items-center">{outlet.outlet_name}</div>
                                    <div className="w-full justify-start text-sm font-medium items-center">{truncateAddress(outlet.address, 40)}</div>
                                    <div className="w-full justify-start text-sm font-medium items-center">{outlet.city}</div>
                                    <div className="w-full justify-start text-sm font-medium">{outlet.manager_name || '-'}</div>
                                    <div className="w-full flex items-center justify-start">
                                        <div className={`px-1.5 py-0.5 rounded-md bg-bg-state-green justify-start text-sm font-medium ${
                                        outlet.status === 'Open' ? 'bg-bg-state-green text-state-green' : 'bg-bg-state-red text-state-red'
                                        }`}>
                                        {outlet.status}
                                    </div>
                                    </div>
                                    <Link href={`/form/outlet/edit-outlet/${outlet.id}`}>
                                    <div className="flex justify-end">
                                        <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} 
                                        />
                                    </div>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <EmptyStateTable
                                title="Outlet not found"
                                orangeDesc="Add outlet"
                                description=" to create a new outlet."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}