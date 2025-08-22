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


export default function AddRReconciliationPage() {
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;

    const [dropdownOptions, setDropdownOptions] = useState<any[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [supplier, setSupplier] = useState<string>('');
    const [products, setProducts] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [returnNumber, setReturnNumber] = useState('');
    const [reason, setReason] = useState('');
    const [returnDate, setReturnDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
    const [selectedInvoiceData, setSelectedInvoiceData] = useState<any | null>(null);

    const formatRupiah = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v || 0));

    useEffect(() => {
        if (!outletId) return;
        const fetchInvoices = async () => {
            try {
                const res = await fetch(`/api/outlets/SP/purchase-invoice/list?outletId=${outletId}`);
                const body = await res.json();
                if (res.ok) {
                    const opts = (body.data || []).map((inv: any) => ({ label: inv.invoice_number || `#${inv.id}`, value: String(inv.id) }));
                    setDropdownOptions(opts);
                }
            } catch (e) { console.error('fetch invoices', e); }
        };
        fetchInvoices();
    }, [outletId]);

    const handleDropdownChange = async (value: string | null) => {
        setSelectedOption(value);
        setSupplier('');
        setProducts([]);
        setItems([]);
        if (!value) return;
        try {
            const res = await fetch(`/api/outlets/SP/purchase-invoice/show/${value}`);
            const body = await res.json();
            if (!res.ok) { alert(body.message || 'Failed to fetch invoice'); return; }
            const data = body.data || {};
            setSupplier(data.supplier_name || data.supplier || '');
            setSelectedInvoiceData(data || null);
            // choose products list - be tolerant about field names
            const prodList = data.products || data.items || data.purchase_items || [];
            // map to UI items
            const mapped = prodList.map((p: any) => ({
                // prefer the raw_material id returned by the invoice show API
                id: p.raw_material_id ?? p.product_id ?? p.id ?? null,
                material_name: p.material_name || p.product_name || p.name || '',
                unit_name: p.unit_name || p.unit || '',
                // prefer ordered_unit_price from the invoice join, fall back to other possible names
                price_per_unit: Number(p.ordered_unit_price ?? p.unit_price ?? p.price_per_unit ?? p.price ?? 0),
                ordered_quantity: Number(p.ordered_quantity ?? p.quantity ?? p.qty ?? 0),
                quantity_out: 0,
                available: Number(p.acceptedAmount ?? p.remaining_stock ?? p.ordered_quantity ?? p.quantity ?? 0),
            }));
            setProducts(mapped);
            setItems((mapped as any[]).map((m: any) => ({ ...m })));
        } catch (e) { console.error('fetch invoice detail', e); alert('Connection error'); }
    };

    const handleItemChange = (index: number, patch: Partial<any>) => {
        setItems(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...patch };
            return copy;
        });
    };

    const calculateSubtotal = () => {
        return items.reduce((s, it) => s + (Number(it.quantity_out || 0) * Number(it.price_per_unit || 0)), 0);
    };

    // derive discount/tax percents from selected invoice data when available
    const derived = (() => {
        const inv = selectedInvoiceData || {};
    // API returns purchase order values under purchase_order_* aliases
    const discountAmt = Number((inv.purchase_order_discount_amount ?? inv.discount_amount ?? inv.discount) || 0);
    const taxAmt = Number((inv.purchase_order_tax_amount ?? inv.tax_amount ?? inv.tax) || 0);
    const baseTotal = Number((inv.purchase_order_total ?? inv.total_amount ?? inv.base_total) || 0);

    // prefer computing percent from baseTotal when available
    if (baseTotal > 0) {
        const discountPercent = baseTotal > 0 ? (discountAmt / baseTotal) * 100 : 0;
        // compute tax percent relative to (baseTotal - discountAmt) to match invoice behaviour
        const taxPercent = (baseTotal - discountAmt) > 0 ? (taxAmt / (baseTotal - discountAmt)) * 100 : 0;
        return { 
            discountPercent: Math.round(discountPercent), 
            taxPercent: Math.round(taxPercent) 
        };
    }

    // fallback: if tax amount exists and seems like 10% fixed, infer base
    if (taxAmt > 0) {
        const base = taxAmt / 0.1;
        const discountPercent = base > 0 ? (discountAmt / base) * 100 : 0;
        const taxPercent = base > 0 ? (taxAmt / base) * 100 : 0;
        return { 
            discountPercent: Math.round(discountPercent), 
            taxPercent: Math.round(taxPercent) 
        };
    }

    return { discountPercent: 0, taxPercent: 0 };
})();

    const calculateDiscountAmount = () => Math.round(calculateSubtotal() * (Number(derived.discountPercent || 0) / 100));
    const calculateFeeAmount = () => Math.round(calculateSubtotal() * (Number(derived.taxPercent || 0) / 100));
    const calculateTotal = () => calculateSubtotal() - calculateDiscountAmount() + calculateFeeAmount();

    const hasInvalid = items.some(it => Number(it.quantity_out) < 0 || Number(it.quantity_out) > Number(it.available || 0));

    const handleSubmit = async (e: any) => {
        e?.preventDefault();
        if (!selectedOption) { alert('Please select a purchase invoice'); return; }
        if (hasInvalid) { alert('Please fix invalid quantities'); return; }
        setLoading(true);
        try {
            // 1) Upload files (if any) to storage endpoint — use folder override 'purchase_return'
            let uploadedUrls: string[] = [];
            if (selectedFiles && selectedFiles.length > 0) {
                const form = new FormData();
                selectedFiles.forEach((f) => form.append('files', f));
                // include outlet id for easier organization server-side
                form.append('invoiceId', String(selectedOption));
                form.append('folder', 'purchase_return');
                const upRes = await fetch('/api/outlets/SP/stock-in/upload', { method: 'POST', body: form });
                if (upRes.ok) {
                    const upBody = await upRes.json();
                    uploadedUrls = upBody.urls || [];
                } else {
                    console.warn('File upload returned not-ok', upRes.status);
                }
            }

            // 2) Build payload and POST to the new purchase-return API
            const preparedItems = items
                .filter((it: any) => Number(it.quantity_out) > 0)
                .map((it: any) => ({ product_id: it.id, quantity: Number(it.quantity_out), price_per_unit: it.price_per_unit }));

            const missing = preparedItems.find((it: any) => !it.product_id);
            if (missing) {
                console.error('Prepared items missing product_id', preparedItems);
                alert('One or more items are missing product_id (raw_material_id). Please re-select the invoice or contact admin.');
                setLoading(false);
                return;
            }

            const payload = {
                outletId,
                purchaseInvoiceId: selectedOption,
                returnNumber: returnNumber || null,
                returnDate: returnDate || new Date().toISOString().split('T')[0],
                reason: reason || null,
                items: preparedItems,
                images: uploadedUrls,
            };

            const res = await fetch(`/api/outlets/R/purchase-return/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const body = await res.json();
            if (!res.ok) {
                alert(body.message || 'Failed to create purchase return');
                setLoading(false);
                return;
            }

            // success — navigate back to return list or show page
            alert(body.message || 'Purchase return saved');
            router.push(`/outlet/R/purchase-return/${outletId}`);
        } catch (e) { console.error(e); alert('Submit failed'); }
        finally { setLoading(false); }
    };

    const handleSupplierChange = (e: any) => setSupplier(String(e?.target?.value || ''));

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Return Details</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the details below</p>
                    </div>

                    <Dropdown
                    label='Purchase Return Number'
                    placeholder='Select Purchase Return'
                    options={dropdownOptions}
                    value={selectedOption ?? ''}
                    onChange={handleDropdownChange}
                    />

                    {!selectedOption && (
                        <div className="text-sm text-state-red font-medium">Please select a purchase return first</div>
                    )}

                    <CustomInput
                    intent={'disabled'}
                    label='Supplier'
                    placeholder='Please select the invoice number'
                    value={supplier}
                    onChange={handleSupplierChange}
                    />

                    <CustomInput
                    intent={selectedOption ? 'default' : 'disabled'}
                    disabled={!selectedOption}
                    label='Return No.'
                    placeholder={selectedOption ? 'Ex: RET-123 (leave empty to auto-generate)' : 'Select invoice first'}
                    value={returnNumber}
                    onChange={(e) => setReturnNumber(String(e.target.value))}
                    />

                    <CustomInput
                    intent={selectedOption ? 'default' : 'disabled'}
                    disabled={!selectedOption}
                    label='Reason'
                    placeholder={selectedOption ? 'Reason for return' : 'Select invoice first'}
                    value={reason}
                    onChange={(e) => setReason(String(e?.target?.value || ''))}
                    />

                    <DateInput
                        label='Return Date'
                        value={returnDate ? new Date(returnDate) : undefined}
                        onChange={(d:any) => {
                            if (!selectedOption) return;
                            setReturnDate(d ? (new Date(d)).toISOString().split('T')[0] : null);
                        }}
                    />

                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full justify-between items-center'>
                                <p className='font-medium text-sm text-grey-desc'>Return Details</p>
                            </div>
                            <div className='flex flex-col gap-0'>
                                <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                                    <div className="min-w-10">No.</div>
                                    <div className="w-full">Finished Goods</div>
                                    <div className="w-full">Amount Return</div>
                                    <div className='w-full'>Amount ordered</div>
                                    <div className="min-w-10">Unit</div>
                                    <div className="w-full">Price per unit (Rp)</div>
                                    <div className="w-full">Total (Rp)</div>
                                </div>

                                {items.length === 0 ? (
                                    <div className="w-full text-center py-8 text-grey-desc font-medium">Please select the purchase return</div>
                                ) : (
                                    items.map((p, index) => (
                                        <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                            <div className="min-w-10">{index + 1}.</div>
                                            <div className="w-full">{p.material_name}</div>
                                            <div className="w-full">
                                                <CustomInput
                                                    className='w-full'
                                                    placeholder={selectedOption ? 'Ex: 10' : 'Select invoice first'}
                                                    value={String(p.quantity_out || '')}
                                                    disabled={!selectedOption}
                                                    onChange={(e) => handleItemChange(index, { quantity_out: Number(e.target.value.replace(/[^0-9]/g,'')) })}
                                                />
                                            </div>
                                            <div className='w-full'>
                                                {(Number(p.quantity_out || 0) > Number(p.ordered_quantity ?? 0)) ? (
                                                    <span className='text-state-red'>Error, more than being ordered</span>
                                                ) : (
                                                    (p.available ?? '-')
                                                )}
                                            </div>
                                            <div className="min-w-10">{p.unit_name}</div>
                                            <div className="w-full">{formatRupiah(Number(p.price_per_unit ?? 0))}</div>
                                            <div className='w-full'>{formatRupiah((Number(p.quantity_out || 0) * Number(p.price_per_unit ?? 0)))}</div>
                                        </div>
                                    ))
                                )}
                                </div>
                    <div className='w-full justify-end flex flex-col items-end gap-3'>
                        {items.filter(it => Number(it.quantity_out || 0) > 0).map((p, index) => (
                            <div key={index} className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                Product: {p.material_name}
                                <span>Rp {formatRupiah(Number(p.price_per_unit ?? 0) * Number(p.quantity_out || 0))}</span>
                            </div>
                        ))}
                        <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-primary-orange'>
                            <div className='text-grey-desc'>Subtotal</div>
                            <span>{formatRupiah(calculateSubtotal())}</span>
                        </div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                <div className='inline-flex gap-1'>
                                    <div className='inline-flex gap-1'>Discount <span className='text-primary-orange'>{Number(derived.discountPercent || 0).toFixed(2)}%</span>:</div>
                                </div>
                                <span>{formatRupiah(calculateDiscountAmount())}</span>
                        </div>
                            <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                <div className='inline-flex gap-1'>Tax <span className='text-state-red'>{Number(derived.taxPercent || 0).toFixed(2)}%</span>:</div>
                                <span>{formatRupiah(calculateFeeAmount())}</span>
                            </div>
                        <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-base font-medium text-primary-orange'>
                            <div className='text-grey-desc'>Total</div>
                            <span>{formatRupiah(calculateTotal())}</span>
                        </div>
                        <CustomButton className='mt-3' type="submit" variant="primary" size="lg" disabled={loading || hasInvalid}>
                                {loading ? 'Saving...' : 'Save Purchase Return'}
                            </CustomButton>
                    </div>

                </form>

            </div>
        </div>
    );
}