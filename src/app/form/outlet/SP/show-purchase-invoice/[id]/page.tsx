'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';
import { DateInput } from '@/components/ui/dateInput';

import { useUser } from '@/context/UserContext';
import Link from 'next/link';

interface Product {
    id: number;
    material_name: string;
    sku: string;
    unit_name: string;
    remaining_stock: number;
    price_per_unit: number;
    ordered_quantity: number; // original quantity on the purchase order
    acceptedAmount?: number; // amount user accepts/receives
    ordered_unit_price?: number; // price from the purchase order
}
export default function ShowPurchaseInvoicePage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [invoice, setInvoice] = useState<any | null>(null);
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatRupiah = (value: number | string | null | undefined) => {
        const num = Number(value || 0);
        return new Intl.NumberFormat('id-ID').format(Math.round(num));
    };

    const calculateSubtotal = () => {
        return items.reduce((s, it) => s + ((it.acceptedAmount ?? it.ordered_quantity ?? 0) * (it.price_per_unit ?? it.ordered_unit_price ?? 0)), 0);
    };

    useEffect(() => {
        const invoiceId = params.id as string;
        if (!invoiceId) return;

        const fetchInvoice = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/outlets/SP/purchase-invoice/show/${invoiceId}`);
                const body = await res.json();
                if (!res.ok) {
                    setError(body.message || 'Failed to fetch');
                } else {
                    const data = body.data;
                    setInvoice(data);
                    const mapped: Product[] = (data.items || []).map((it: any) => ({
                        id: it.raw_material_id || it.purchase_order_detail_id || it.purchase_invoice_item_id,
                        material_name: it.material_name || '',
                        sku: it.sku || '',
                        unit_name: it.unit_name || '',
                        remaining_stock: 0,
                        price_per_unit: it.ordered_unit_price ?? 0,
                        ordered_quantity: it.ordered_quantity ?? 0,
                        acceptedAmount: it.quantity_received ?? it.acceptedAmount
                    }));
                    setItems(mapped);
                }
            } catch (e: any) {
                setError(e?.message || 'Connection error');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [params.id]);

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <div className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Invoice Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Viewing purchase invoice details</p>
                    </div>

                    {loading && <div className='text-grey-desc font-medium justify-center flex'>Loading...</div>}
                    {error && <div className="text-state-red">{error}</div>}

                    {!loading && invoice && (
                        <>
                            <div className='inline-flex w-full gap-3'>
                                <CustomInput label="Purchase Order" intent={'disabled'} value={invoice.purchase_order_number || ''} disabled />
                            </div>

                            <div className='inline-flex w-full gap-3'>
                                <CustomInput label="Supplier" intent={'disabled'} value={invoice.supplier_name || ''} disabled />
                                <CustomInput label="Receipt date" intent={'disabled'} value={invoice.receipt_date ? new Date(invoice.receipt_date).toLocaleDateString() : ''} disabled />
                            </div>

                            <div className='inline-flex w-full gap-3'>
                                <CustomInput label="Payment amount (Rp)" intent={'disabled'} value={formatRupiah(invoice.payment_amount)} disabled />
                                <CustomInput label="Payment due date" intent={'disabled'} value={invoice.payment_due_date ? new Date(invoice.payment_due_date).toLocaleDateString() : ''} disabled />
                            </div>

                            <div className='inline-flex w-full gap-3'>
                                <CustomInput label="Payment status" intent={'disabled'} value={invoice.payment_status || ''} disabled />
                                <CustomInput label="PO total (Rp)" intent={'disabled'} value={formatRupiah(invoice.purchase_order_total)} disabled />
                            </div>

                            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full justify-start items-center'>
                                <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                            </div>

                            <div className='flex flex-col gap-0'>
                                <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justif-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                                    <div className="min-w-10">No.</div>
                                    <div className="w-full">Product</div>
                                    <div className="w-full">Price per unit (Rp)</div>
                                    <div className="min-w-10">Unit</div>
                                    <div className="w-full">Accepted Amount</div>
                                    <div className="w-full">Amount Left</div>
                                    <div className="w-full">Total (Rp)</div>
                                </div>
                                {items.length === 0 ? (
                                    <div className="w-full text-center py-8 text-grey-desc font-medium">No product items.</div>
                                ) : (
                                    items.map((p, index) => (
                                        <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                            <div className="min-w-10">{index + 1}.</div>
                                            <div className="w-full">{p.material_name}</div>
                                            <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                            <div className="min-w-10">{p.unit_name}</div>
                                            <div className="w-full">{p.acceptedAmount ?? p.ordered_quantity ?? 0}</div>
                                            <div className="w-full">{Math.max((p.ordered_quantity ?? 0) - (p.acceptedAmount ?? p.ordered_quantity ?? 0), 0)}</div>
                                            <div className="w-full">{formatRupiah((p.acceptedAmount ?? p.ordered_quantity ?? 0) * (p.price_per_unit ?? 0))}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Summary */}
                            <div className='w-full justify-end flex flex-col items-end gap-3'>
                                {items.map((p, index) => (
                                    <div key={index} className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                        Product: {p.material_name}
                                        <span>Rp {formatRupiah((p.acceptedAmount ?? p.ordered_quantity ?? 0) * (p.price_per_unit ?? 0))}</span>
                                    </div>
                                ))}
                                <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                                <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-primary-orange'>
                                    <div className='text-grey-desc'>Subtotal</div>
                                    <span>{formatRupiah(calculateSubtotal())}</span>
                                </div>
                                    <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                        <div className='inline-flex gap-1'>Discount <span className='text-primary-orange'>{invoice.purchase_order_total ? (Number(invoice.purchase_order_discount_amount || 0) / Number(invoice.purchase_order_total) * 100).toFixed(2) : '0.00'}%</span>:</div>
                                        <span>{formatRupiah(invoice.purchase_order_discount_amount)}</span>
                                    </div>
                                    <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                        <div className='inline-flex gap-1'>Tax <span className='text-state-red'>{invoice.purchase_order_total ? (Number(invoice.purchase_order_tax_amount || 0) / Number(invoice.purchase_order_total) * 100).toFixed(2) : '0.00'}%</span>:</div>
                                        <span>{formatRupiah(invoice.purchase_order_tax_amount)}</span>
                                    </div>
                                <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                    <div className='text-grey-desc'>Payment amount</div>
                                    <span>{formatRupiah(invoice.payment_amount)}</span>
                                </div>
                                <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                    <div className='text-grey-desc'>From total value of</div>
                                    <span>{formatRupiah(invoice.purchase_order_total)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <CustomButton
                        className='mt-3'
                        type='button'
                        variant="outline"
                        size="lg"
                        onClick={router.back}
                    >
                    Go back
                    </CustomButton>
                </div>
            </div>
        </div>
    );
}