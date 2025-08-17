'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';

// imports intentionally minimal for read-only view
// CustomFileUpload intentionally not used on show page


export default function ShowStockInInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;

    const [invoices, setInvoices] = useState<any[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [receivedDate, setReceivedDate] = useState<Date | undefined>(undefined);
    // no file upload on show page

    // fetch invoice list for dropdown (keep for navigation, but optional)
    useEffect(() => {
        if (!outletId) return;
        const fetchList = async () => {
            setLoadingInvoices(true);
            try {
                const res = await fetch(`/api/outlets/SP/purchase-invoice/list?outletId=${outletId}`);
                const body = await res.json();
                if (res.ok) setInvoices(body.data || []);
            } catch (e) {
                console.error(e);
            } finally { setLoadingInvoices(false); }
        };
        fetchList();
    }, [outletId]);

    // fetch the stock-in record to show
    useEffect(() => {
        const fetchStockIn = async () => {
            if (!params?.id) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/outlets/SP/stock-in/show/${params.id}`);
                const body = await res.json();
                if (!res.ok) { setError(body.message || 'Failed to fetch stock in'); setLoading(false); return; }
                const data = body.data;
                // populate selectedInvoice-like object to reuse layout
                const invoiceLike = {
                    id: data.purchase_invoice_id,
                    invoice_number: data.invoice_number || null,
                    supplier_name: data.supplier_name,
                    image_urls: data.image_urls || [],
                };
                setSelectedInvoice(invoiceLike);
                // build items array with one item based on stock_in
                const mappedItem = {
                    purchase_invoice_item_id: data.purchase_invoice_item_id,
                    purchase_order_detail_id: data.purchase_order_detail_id,
                    raw_material_id: data.raw_material_id,
                    material_name: data.material_name,
                    unit_name: data.unit_name,
                    price_per_unit: data.total_value && data.quantity_in ? (Number(data.total_value) / Number(data.quantity_in)) : 0,
                    ordered_quantity: data.quantity_in,
                    quantity_in: data.quantity_in,
                    received_date: data.received_date ? new Date(data.received_date) : undefined,
                };
                setItems([mappedItem]);
                setReceivedDate(mappedItem.received_date);
            } catch (e:any) {
                console.error(e);
                setError(e?.message || 'Connection error');
            } finally { setLoading(false); }
        };
        fetchStockIn();
    }, [params]);

    const orderOptions = invoices.map(inv => ({ label: inv.invoice_number, value: String(inv.id) }));

    const handleInvoiceChange = async (value: string) => {
        // in show page we still allow selecting invoice to inspect, reuse existing show endpoint
        if (!value) { setSelectedInvoice(null); setItems([]); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/outlets/SP/purchase-invoice/show/${value}`);
            const body = await res.json();
            if (!res.ok) { setError(body.message || 'Failed to fetch invoice'); return; }
            setSelectedInvoice(body.data || null);
            const mapped = (body.data.items || []).map((it: any) => ({
                purchase_invoice_item_id: it.purchase_invoice_item_id,
                purchase_order_detail_id: it.purchase_order_detail_id,
                raw_material_id: it.raw_material_id,
                material_name: it.material_name,
                unit_name: it.unit_name,
                price_per_unit: it.ordered_unit_price ?? 0,
                ordered_quantity: it.ordered_quantity ?? 0,
                quantity_in: 0,
                received_date: undefined,
            }));
            setItems(mapped);
        } catch (e: any) {
            setError(e?.message || 'Connection error');
        } finally { setLoading(false); }
    };

    const handleItemChange = (index: number, patch: Partial<any>) => {
        setItems(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...patch };
            return copy;
        });
    };

    const hasInvalid = items.some(it => it.quantity_in < 0 || !Number.isFinite(Number(it.quantity_in)));

    const handleSubmit = async (e: any) => {
    // This page is read-only; no submit action
    e?.preventDefault?.();
    alert('This view is read-only');
    };

    const formatRupiah = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v || 0));

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <div className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Stock In Details</h1>
                        <p className="text-sm font-medium text-grey-desc">Select an invoice, then enter received quantities and dates per product</p>
                    </div>

                    <div className='flex flex-col w-full gap-4'>
                        <CustomInput
                            label='Invoice Number'
                            intent={'disabled'}
                            className="w-full font-medium"
                            value={selectedInvoice?.invoice_number ? String(selectedInvoice.invoice_number) : ''}
                            disabled
                        />
                    </div>

                    {selectedInvoice && (
                        <>
                            <div className='inline-flex w-full gap-3'>
                                <CustomInput label='Supplier' intent={'disabled'} value={selectedInvoice.supplier_name || ''} disabled />
                                <CustomInput label='Received date' intent={'disabled'} value={receivedDate ? new Date(receivedDate).toLocaleDateString() : ''} disabled />
                            </div>

                            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full justify-start items-center'>
                                <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                            </div>

                            <div className='flex flex-col gap-0'>
                                <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justif-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                                    <div className="min-w-10">No.</div>
                                    <div className="w-full">Product</div>
                                    <div className="w-full">Amount In</div>
                                    <div className="min-w-10">Unit</div>
                                    <div className="w-full">Price per unit (Rp)</div>
                                    <div className="w-full">Total (Rp)</div>
                                </div>

                                {items.length === 0 ? (
                                    <div className="w-full text-center py-8 text-grey-desc font-medium">This invoice has no products.</div>
                                ) : (
                                    items.map((p, index) => (
                                        <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                            <div className="min-w-10">{index + 1}.</div>
                                            <div className="w-full">{p.material_name}</div>
                                            <div className="w-full">
                                                <CustomInput className='w-full' intent={'disabled'} disabled placeholder='Ex: 10' value={String(p.quantity_in || '')} />
                                            </div>
                                            <div className="min-w-10">{p.unit_name}</div>
                                            <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                            <div className='w-full'>{formatRupiah((Number(p.quantity_in) || 0) * Number(p.price_per_unit || 0))}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className='text-grey-desc text-sm font-medium flex flex-col gap-2'>
                                Stock in picture as a proof of received stock
                                <div className='flex gap-2'>
                                    {selectedInvoice && selectedInvoice.image_urls && selectedInvoice.image_urls.length > 0 ? (
                                        selectedInvoice.image_urls.map((u:any, i:number) => (
                                            <img key={i} src={u} className='w-32 h-32 object-cover rounded-md' alt={`proof-${i}`} />
                                        ))
                                    ) : (
                                        <div className='text-grey-desc'>No images</div>
                                    )}
                                </div>
                            </div>

                            <CustomButton className='mt-3' type='button' variant="outline" size="lg" onClick={router.back}>Go back</CustomButton>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}