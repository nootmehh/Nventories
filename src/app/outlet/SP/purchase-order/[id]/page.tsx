'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from "@/components/ui/dropdown";
import EmptyStateTable from "@/components/EmptyStateTable";

import {
  Plus,
  Eye,
  Search,
  Trash,
} from 'lucide-react';

export default function POrderPage() {
    const { user, allOutlets } = useUser();
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;
    
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All status');
    const orderStatusFilterOptions = [
        { label: 'All status', value: 'All status' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Partially Delivered', value: 'Partially Delivered' },
        { label: 'Fully Delivered', value: 'Fully Delivered' },
        { label: 'Cancelled', value: 'Cancelled' },
    ];
    
    const fetchPurchaseOrders = async () => {
        setLoading(true);
        if (!user?.business?.id || !outletId) {
            router.push('/outlet');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('outletId', outletId);
            if (searchQuery) params.append('q', searchQuery);
            if (orderStatusFilter !== 'All status') params.append('status', orderStatusFilter);
            
            const response = await fetch(`/api/outlets/SP/porder/list?${params.toString()}`);
            const result = await response.json();
            
            if (response.ok) {
                setPurchaseOrders(result.data);
            } else {
                console.error("Failed to fetch purchase orders:", result.message);
                setPurchaseOrders([]);
            }
        } catch (error) {
            console.error("Connection error while fetching purchase orders:", error);
            setPurchaseOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePorder = async (orderId: number) => {
      if (!window.confirm(`Are you sure you want to delete order #${orderId}?`)) {
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/outlets/SP/porder/delete/${orderId}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();

        if (response.ok) {
          alert(data.message || 'Purchase order deleted successfully!');
          setPurchaseOrders(prev => prev.filter(order => order.id !== orderId));
        } else {
          alert(data.message || 'Failed to delete purchase order.');
        }
      } catch (error) {
        console.error('Failed to delete purchase order:', error);
        alert('Connection error. Failed to delete purchase order.');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
        if (outletId && user?.business?.id) {
            fetchPurchaseOrders();
        }
    }, [outletId, user?.business?.id, searchQuery, orderStatusFilter]);

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);
    
    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                                Purchase Order List <span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                                Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/form/outlet/SP/add-purchase-order/${outletId}`}>
                                <CustomButton
                                    variant="primary"
                                    size="lg"
                                    iconPlacement="right"
                                    Icon={Plus}
                                >
                                    Add purchase order
                                </CustomButton>
                            </Link>
                        </div>
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search purchase order"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Dropdown
                            className="w-64"
                            placeholder="Delivery Status"
                            options={orderStatusFilterOptions}
                            value={orderStatusFilter}
                            onChange={setOrderStatusFilter}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justify-start text-sm font-semibold uppercase gap-6 text-grey-desc">
                            <div className="min-w-6">No.</div>
                            <div className="w-full">Order No.</div>
                            <div className="w-full">Date</div>
                            <div className="w-full">Supplier</div>
                            <div className="w-full">Total Payment</div>
                            <div className="min-w-20">Invoice Process</div>
                            <div className="min-w-20">Status</div>
                            <div className="min-w-15 flex justify-center">
                                Details
                            </div>
                            <div className="min-w-15 flex justify-center">
                                Delete
                            </div>
                        </div>

                        {/* Konten Tabel */}
                        {loading ? (
                            <div className="w-full text-center py-8 text-grey-desc">Loading purchase orders...</div>
                        ) : purchaseOrders.length > 0 ? (
                            purchaseOrders.map((order, index) => (
                                <div key={order.id} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-6">{index + 1}.</div>
                                    <div className="w-full">{order.invoice_number}</div>
                                    <div className="w-full">{new Date(order.order_date).toLocaleDateString()}</div>
                                    <div className="w-full">{order.supplier_name}</div>
                                    <div className="w-full">{`Rp ${Number(order.total_amount).toLocaleString('id-ID')}`}</div>
                                    <div className="min-w-20">{order.invoice_process}</div>
                                    <div className="min-w-20">{order.delivery_status}</div>
                                    <div className="min-w-15 flex justify-center">
                                        <Link href={`/form/outlet/SP/show-purchase-order/${order.id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Eye} />
                                        </Link>
                                    </div>
                                    <div className="min-w-15 flex justify-center">
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeletePorder(order.id)}/>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyStateTable
                                title="Purchase order not found"
                                orangeDesc="Add purchase order"
                                description="to add purchase a new list."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
