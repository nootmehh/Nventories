'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';
import { DateInput } from '@/components/ui/dateInput';
import FinishedGoodsModal from '@/components/modal/finishedGoodsModal';

import CustomFileUpload from '@/components/ui/customFileUpload';
import { Plus } from 'lucide-react';


export default function AddStockOutPage() {
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
    const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
    const [showFinishedGoodsModal, setShowFinishedGoodsModal] = useState(false);
    const [stockOutNumber, setStockOutNumber] = useState<string>('');

    // fetch invoice list for dropdown
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

    const orderOptions = invoices.map(inv => ({ label: inv.invoice_number, value: String(inv.id) }));

    const handleItemChange = (index: number, patch: Partial<any>) => {
        setItems(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...patch };
            return copy;
        });
    };

    const hasInvalid = items.some(it => Number(it.quantity_out) < 0 || !Number.isFinite(Number(it.quantity_out)));

    const handleSubmit = async (e: any) => {
        e?.preventDefault();
        console.log('handleSubmit start', { selectedInvoiceId: selectedInvoice?.id, itemsLength: items.length, selectedFilesCount: selectedFiles?.length ?? 0 });
            const payloadItems = items.filter(it => Number(it.quantity_out) > 0).map(it => ({
                purchase_invoice_item_id: it.purchase_invoice_item_id,
                raw_material_id: it.raw_material_id,
                quantity_out: Number(it.quantity_out),
                total_value: Number((Number(it.quantity_out) * Number(it.price_per_unit || 0)).toFixed(2)),
                received_date: it.received_date ? (new Date(it.received_date)).toISOString() : (receivedDate ? receivedDate.toISOString() : null),
            }));
        console.log('payloadItems computed', payloadItems);
        if (payloadItems.length === 0) { alert('Please enter at least one product quantity'); return; }
        // client-side availability check
        for (const it of items) {
            const qty = Number(it.quantity_out || 0);
            const avail = Number(it.available || 0);
            if (qty > avail) { alert('Stock unavailable!'); return; }
        }
        setLoading(true);
        // upload images to server-side upload endpoint (so server uses service role key)
        let imageUrls: string[] = [];
        try {
                if (selectedFiles && selectedFiles.length > 0) {
                console.log('Uploading files to server upload endpoint', selectedFiles.map(f => f.name));
                const form = new FormData();
                for (const f of selectedFiles) form.append('files', f);
                    // instruct upload endpoint to place files under inventory_img/stock_out
                    form.append('folder', 'stock_out');
                const upRes = await fetch('/api/outlets/SP/stock-in/upload', { method: 'POST', body: form });
                const upBody = await upRes.json();
                console.log('server upload response', upRes.status, upBody);
                if (!upRes.ok) { console.error('Server upload failed', upBody); throw new Error(upBody.message || 'Upload failed'); }
                imageUrls = Array.isArray(upBody.urls) ? upBody.urls : [];
            }
        } catch (uploadError) {
            console.error('Image upload failed (client -> server)', uploadError);
            alert('Image upload failed. Please try again.');
            setLoading(false);
            return;
        }
        try {
            console.log('Sending stock-out payload', { outletId, items: payloadItems, images: imageUrls });
            const res = await fetch('/api/outlets/MS/stock-out/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outletId, items: payloadItems, images: imageUrls, stockOutNumber: stockOutNumber || null, transactionDate: receivedDate ? receivedDate.toISOString() : null }),
            });
            const body = await res.json();
            console.log('Stock-out API response', { status: res.status, body });
            if (!res.ok) { alert(body.message || 'Failed'); }
            else { alert(body.message || 'Stock out saved'); router.push(`/outlet/MS/stock-out/${outletId}`); }
        } catch (e) { console.error('Stock-out submit failed', e); alert('Connection error'); }
        finally { setLoading(false); }
    };

    const formatRupiah = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v || 0));

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Stock Out Details</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the details below</p>
                    </div>

                    <CustomInput
                    className='w-full'
                    intent={'default'}
                    label='Stock out no.'
                    placeholder='Ex: OUT-123 (leave empty to auto-generate)'
                    value={stockOutNumber}
                    onChange={(e) => setStockOutNumber(String(e.target.value))}
                    />

                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full justify-between items-center'>
                                <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                                <CustomButton
                            type="button"
                            variant={'primary'}
                            size={'sm'}
                            iconPlacement='right'
                            Icon={Plus}
                            onClick={() => setShowFinishedGoodsModal(true)}
                        >Add Finished Goods</CustomButton>
                            </div>
                            <div className='flex flex-col gap-0'>
                                <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                                    <div className="min-w-10">No.</div>
                                    <div className="w-full">Finished Goods</div>
                                    <div className="w-full">Amount Out</div>
                                    <div className='w-full'>Available</div>
                                    <div className="min-w-10">Unit</div>
                                    <div className="w-full">Cost per unit (Rp)</div>
                                    <div className="w-full">Total (Rp)</div>
                                </div>

                                {items.length === 0 ? (
                                    <div className="w-full text-center py-8 text-grey-desc font-medium">Please choose a finished goods</div>
                                ) : (
                                    items.map((p, index) => (
                                        <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                            <div className="min-w-10">{index + 1}.</div>
                                            <div className="w-full">{p.material_name}</div>
                                            <div className="w-full">
                                                <CustomInput className='w-full' placeholder='Ex: 10' value={String(p.quantity_out || '')}
                                                    onChange={(e) => handleItemChange(index, { quantity_out: e.target.value.replace(/[^0-9]/g,'') })}
                                                />
                                            </div>
                                            <div className='w-full'>{p.available ?? '-'}</div>
                                            <div className="min-w-10">{p.unit_name}</div>
                                            <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                            <div className='w-full'>{formatRupiah((Number(p.quantity_out) || 0) * Number(p.price_per_unit || 0))}</div>
                                        </div>
                                    ))
                                )}
                                </div>
                                <div className='text-grey-desc text-sm font-medium flex flex-col gap-1'>
                                    Stock out picture as a proof of received stock
                                    <CustomFileUpload
                                        accept="image/*"
                                        multiple
                                        onFiles={(files) => setSelectedFiles(files)}
                                    />
                                </div>
                        <CustomButton className='mt-3' type="submit" variant="primary" size="lg" disabled={loading || hasInvalid}>
                                {loading ? 'Saving...' : 'Save Stock Out'}
                            </CustomButton>

                </form>
                {/* Finished goods modal (read-only) */}
                                <FinishedGoodsModal isOpen={showFinishedGoodsModal} onCloseAction={() => setShowFinishedGoodsModal(false)} outletId={outletId}
                                    isSelectable={true}
                                    onSaveAction={(selected) => {
                                        // map to items expected by this form
                                        const mapped = selected.map(s => ({
                                            purchase_invoice_item_id: null,
                                            purchase_order_detail_id: null,
                                            raw_material_id: s.id,
                                            material_name: s.product_name,
                                            unit_name: s.unit_name,
                                            price_per_unit: s.price_per_unit ?? 0,
                                            ordered_quantity: 0,
                                            quantity_out: 1,
                                            available: s.remaining_stock ?? 0,
                                            received_date: undefined,
                                        }));
                                        setItems(prev => [...prev, ...mapped]);
                                    }}
                                />
            </div>
        </div>
    );
}