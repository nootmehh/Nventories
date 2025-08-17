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
  Pencil,
  Search,
  Download,
  Trash,
  Eye,
} from 'lucide-react';

export default function PInvoicePage() {
    const { user, allOutlets } = useUser();
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;
    
    const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [invoiceFilter, setInvoiceFilter] = useState('Filters');
    const invoiceFilterOptions = [
        { label: 'All Status', value: 'All Status' },
        { label: 'Unpaid', value: 'Unpaid' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Partial', value: 'Partial' },
    ];

    const fetchPurchaseInvoices = async () => {
        setLoading(true);
        if (!user?.business?.id || !outletId) {
            router.push('/outlet');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('outletId', outletId);
            if (searchQuery) params.append('q', searchQuery);
            if (invoiceFilter !== 'Filters') params.append('status', invoiceFilter);
            
            const response = await fetch(`/api/outlets/SP/purchase-invoice/list?${params.toString()}`);
            const result = await response.json();
            
            if (response.ok) {
                setPurchaseInvoices(result.data);
            } else {
                console.error("Failed to fetch purchase invoices:", result.message);
                setPurchaseInvoices([]);
            }
        } catch (error) {
            console.error("Connection error while fetching purchase invoices:", error);
            setPurchaseInvoices([]);
        } finally {
            setLoading(false);
        }
    };

        const handleDeletePInvoice = async (invoiceId: number) => {
            if (!window.confirm(`Are you sure you want to delete invoice #${invoiceId}?`)) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/outlets/SP/purchase-invoice/delete/${invoiceId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message || 'Purchase invoice deleted successfully!');
                    setPurchaseInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
                } else {
                    alert(data.message || 'Failed to delete purchase invoice.');
                }
            } catch (error) {
                console.error('Failed to delete purchase invoice:', error);
                alert('Connection error. Failed to delete purchase invoice.');
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        if (outletId && user?.business?.id) {
            fetchPurchaseInvoices();
        }
    }, [outletId, user?.business?.id, searchQuery, invoiceFilter]);

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);
    
    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm">
                <div className="w-full flex flex-col gap-6 items-center justify-center">
                    <div className="flex justify-between items-center w-full">
                        <div className="justify-start flex flex-col gap-1">
                            <h1 className="font-semibold text-lg text-primary-blue">
                                Purchase Invoice List <span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                            </h1>
                            <p className="text-sm font-medium text-grey-desc">
                                Showing newest
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                                <Link href={`/form/outlet/SP/add-purchase-invoice/${outletId}`}>
                                    <CustomButton
                                        variant="primary"
                                        size="lg"
                                        iconPlacement="right"
                                        Icon={Plus}
                                    >
                                        Add purchase invoice
                                    </CustomButton>
                                </Link>
                        </div>
                    </div>
                    {/* Line */}
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className="self-stretch w-full flex justify-between items-center">
                        <CustomInput
                            placeholder="Search purchase invoice"
                            className="w-64 gap-3"
                            iconLeft={<Search />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Dropdown
                            className="w-64"
                            placeholder="All invoice status"
                            options={invoiceFilterOptions}
                            value={invoiceFilter}
                            onChange={setInvoiceFilter}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-4 w-full border-b border-white-3 inline-flex items-center justif-start gap-6 text-grey-desc font-semibold uppercase text-sm">
                            <div className="min-w-6">No.</div>
                            <div className="w-full">Invoice No.</div>
                            <div className="w-full">Date Receipt</div>
                            <div className="w-full">Supplier</div>
                            <div className="w-full">Invoice Amount</div>
                            <div className="w-full">Due Date</div>
                            <div className="w-full">Status</div>
                            <div className="min-w-15">
                                Details
                            </div>
                            <div className="min-w-15">
                                Delete
                            </div>
                        </div>

                        {/* Konten Tabel */}
                        {loading ? (
                            <div className="w-full text-center py-8 text-grey-desc">Loading purchase invoices...</div>
                        ) : purchaseInvoices.length > 0 ? (
                            purchaseInvoices.map((invoice, index) => (
                                <div key={invoice.id} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-6 ">{index + 1}.</div>
                                    <div className="w-full">{invoice.invoice_number}</div>
                                    <div className="w-full">{new Date(invoice.receipt_date).toLocaleDateString()}</div>
                                    <div className="w-full">{invoice.supplier_name}</div>
                                    <div className="w-full">{`Rp ${Number(invoice.payment_amount).toLocaleString('id-ID')}`}</div>
                                    <div className="w-full">{
                                        (invoice.payment_due_date || invoice.due_date || invoice.dueDate)
                                            ? new Date(invoice.payment_due_date || invoice.due_date || invoice.dueDate).toLocaleDateString()
                                            : '-'
                                    }</div>
                                    <div className="w-full">{invoice.payment_status}</div>
                                    <div className="min-w-15 flex justify-center">
                                        <Link href={`/form/outlet/SP/show-purchase-invoice/${invoice.id}`}>
                                            <CustomButton variant="ghost" size="smallIcon" Icon={Eye} />
                                        </Link>
                                    </div>
                                    <div className="min-w-15 flex justify-center">
                                        
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeletePInvoice(invoice.id)} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyStateTable
                                title="No purchase invoices found"
                                orangeDesc="Add purchase invoice"
                                description="to add purchase invoice list."
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}