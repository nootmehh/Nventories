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
}
export default function AddPurchaseInvoicePage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any | null>(null);
    const [receiptDate, setReceiptDate] = useState<Date | undefined>(undefined);
    const [updateAmount, setUpdateAmount] = useState('');
    const [paymentDueDate, setPaymentDueDate] = useState<Date | undefined>(undefined);
    const [products, setProducts] = useState<Product[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Compute discount/tax percent. Prefer server PO total (baseTotal) when available.
    // If baseTotal is provided (>0) we use:
    //   discountPercent = discountAmount / baseTotal * 100
    //   taxPercent = taxAmount / (baseTotal - discountAmount) * 100
    // Otherwise we fall back to the previous updateAmount-based logic.
    const computePercents = (
updatedPrice: number, discountAmount: number, taxAmount: number, baseTotal: number) => {
    const updated = Number(updatedPrice || 0);
    const discount = Number(discountAmount || 0);
    const tax = Number(taxAmount || 0);

    // Hitung base price dari pajak (pajak 10% tetap)
    const base = tax / 0.1;

    // Hitung persentase diskon dari harga normal
    const discountPercent = (discount / base) * 100;

    // Pajak 10% tetap dari harga normal
    const taxPercent = (tax / base) * 100;

    return {
        basePrice: Math.round(base),
        discountPercent: Math.round(discountPercent * 100) / 100,
        taxPercent: Math.round(taxPercent * 100) / 100
    };
    }
    
        const formatRupiah = (value: string | number) => {
        if (value === null || value === undefined || value === '') return '';

        // Convert value to a number safely.
        // Keep decimal point and minus sign; strip other non-numeric characters (commas, spaces, currency symbols).
        const str = String(value).trim();
        const cleaned = str.replace(/[^0-9.-]/g, '');
        const parsed = Number(cleaned);
        if (Number.isNaN(parsed)) return '';

        // Round to integer (rupiah) before formatting
        const rounded = Math.round(parsed);

        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(rounded);
    };

    const fetchPurchaseOrders = async () => {
        if (!outletId) return;

        try {
            const response = await fetch(`/api/outlets/SP/porder/list?outletId=${outletId}&status=Pending`);
            const result = await response.json();
            if (response.ok) {
                setPurchaseOrders(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
        } finally {
            setInitialLoading(false);
        }
    };
    
    useEffect(() => {
        if (outletId && user?.business?.id) {
            fetchPurchaseOrders();
        } else if (!user) {
            router.push('/login');
        }
    }, [outletId, user?.business?.id]);

        const handleInvoiceChange = async (orderId: string) => {
            const order = purchaseOrders.find(o => String(o.id) === orderId);
            if (!order) return;

            setSelectedPurchaseOrder(order);
            // reset dates & amounts
            setReceiptDate(undefined);
            setPaymentDueDate(undefined);
            setUpdateAmount('');

        // Fetch details from show API to get product rows
        setFetchError(null);
            try {
                const res = await fetch(`/api/outlets/SP/porder/show/${orderId}`);
                const json = await res.json();
                if (!res.ok) {
            console.error('Failed to fetch PO details', json);
            setFetchError(json?.message || 'Failed to fetch purchase order details');
                    // fallback: use order.products if present
                    const fallback: Product[] = (order.products || []).map((p: any, idx: number) => ({
                        id: Number(p.raw_material_id ?? p.id ?? idx),
                        material_name: p.material_name ?? p.name ?? '',
                        sku: p.sku ?? '',
                        unit_name: p.unit_name ?? p.unit ?? 'pcs',
                        remaining_stock: p.remaining_stock ?? 0,
                        price_per_unit: Number(p.price_per_unit ?? p.unit_price ?? p.price ?? 0),
                        ordered_quantity: Number(p.quantity ?? p.qty ?? 0),
                        acceptedAmount: 0,
                    }));
                    // ensure discount/tax still available on selectedPurchaseOrder
                    setSelectedPurchaseOrder((prev: any) => ({ ...(prev || {}), discount_amount: order.discount_amount, tax_amount: order.tax_amount }));
                    setProducts(fallback);
                    return;
                }

                const payload = json.data || json;
                // update selected purchase order with the full payload from the show API
                setSelectedPurchaseOrder(payload);
                const details = payload.products ?? payload.details ?? [];

                if (!details || details.length === 0) {
                    // No details returned from API
                    setFetchError('No product details returned from API for this purchase order');
                }

                const mapped: Product[] = (details || []).map((d: any, idx: number) => ({
                    id: Number(d.raw_material_id ?? d.id ?? idx),
                    material_name: d.material_name ?? d.name ?? '',
                    sku: d.sku ?? '',
                    unit_name: d.unit_name ?? d.unit ?? d.unit_name ?? 'pcs',
                    remaining_stock: d.remaining_stock ?? 0,
                    price_per_unit: Number(d.unit_price ?? d.price_per_unit ?? d.price ?? 0),
                    ordered_quantity: Number(d.quantity ?? d.qty ?? 0),
                    acceptedAmount: undefined,
                }));

                setProducts(mapped);
                if (mapped.length > 0) setFetchError(null);
            } catch (err) {
                console.error('Error loading PO details', err);
                setFetchError((err as any)?.message || 'Error loading purchase order details');
                // fallback to whatever order contains
                const fallback2: Product[] = (order.products || []).map((p: any, idx: number) => ({
                    id: Number(p.raw_material_id ?? p.id ?? idx),
                    material_name: p.material_name ?? p.name ?? '',
                    sku: p.sku ?? '',
                    unit_name: p.unit_name ?? p.unit ?? 'pcs',
                    remaining_stock: p.remaining_stock ?? 0,
                    price_per_unit: Number(p.price_per_unit ?? p.unit_price ?? p.price ?? 0),
                    ordered_quantity: Number(p.quantity ?? p.qty ?? 0),
                    acceptedAmount: undefined,
                }));
                setProducts(fallback2);
            }
        };

    const handleAcceptedAmountChange = (productId: number, value: number | undefined) => {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, acceptedAmount: value } : p));
    };

    const calculateSubtotal = () => products.reduce((acc, p) => acc + ((p.acceptedAmount || 0) * (p.price_per_unit || 0)), 0);
    // Calculate amounts using percentages derived from API amounts and updateAmount
    const derived = (() => {
        const updateAmtNum = Number(updateAmount || selectedPurchaseOrder?.total_amount || 0);
        const discountAmt = Number(selectedPurchaseOrder?.discount_amount || 0);
        const taxAmt = Number(selectedPurchaseOrder?.tax_amount || 0);
        const baseTotal = Number(selectedPurchaseOrder?.total_amount || 0);
        return computePercents(updateAmtNum, discountAmt, taxAmt, baseTotal);
    })();

    const calculateDiscountAmount = () => (calculateSubtotal() * (derived.discountPercent || 0)) / 100;
    const calculateFeeAmount = () => (calculateSubtotal() * (derived.taxPercent || 0)) / 100;
    const calculateTotal = () => calculateSubtotal() - calculateDiscountAmount() + calculateFeeAmount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchaseOrder) {
            alert('Please select a purchase order');
            return;
        }
        if (!receiptDate) {
            alert('Please pick a receipt date');
            return;
        }
            if (products.length === 0) {
            alert('No products to save');
            return;
        }

            // validate accepted amounts (only when user provided an acceptedAmount)
            const invalid = products.some(p => p.acceptedAmount !== undefined && (p.acceptedAmount || 0) > (p.ordered_quantity || 0));
            if (invalid) {
                alert('One or more products have accepted amount greater than ordered quantity. Please fix before submitting.');
                setLoading(false);
                return;
            }

        setLoading(true);
        try {
            // Only send products where user entered an accepted amount (> 0)
            const productsPayload = products
                .filter(p => p.acceptedAmount !== undefined && (p.acceptedAmount || 0) > 0)
                .map(p => ({ id: p.id, material_name: p.material_name, quantity_received: Number(p.acceptedAmount || 0) }));

            if (productsPayload.length === 0) {
                alert('Please enter accepted amounts for at least one product before saving.');
                setLoading(false);
                return;
            }

            const paymentAmtNum = Number((updateAmount || 0));

            // Send receiptDate as YYYY-MM-DD to match DATE columns in DB
            const receiptDateOnly = new Date(receiptDate as Date).toISOString().slice(0, 10);

            const body = {
                purchaseOrderId: Number(selectedPurchaseOrder.id),
                receiptDate: receiptDateOnly,
                // format payment amount as number with 2 decimals (DB is DECIMAL(10,2))
                paymentAmount: Number(paymentAmtNum.toFixed(2)),
                paymentDueDate: paymentDueDate ? new Date(paymentDueDate).toISOString().slice(0, 10) : null,
                paymentStatus: paymentAmtNum >= (Number(selectedPurchaseOrder.total_amount || 0) - Number(selectedPurchaseOrder.dp_amount || 0)) ? 'Paid' : 'Partially Paid',
                products: productsPayload,
            };

            const res = await fetch('/api/outlets/SP/purchase-invoice/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create invoice');
            alert(data.message || 'Purchase invoice created');
            router.push(`/outlet/SP/purchase-invoice/${outletId}`);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Failed to save invoice');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div>Loading form data...</div>;
    }

    const orderOptions = purchaseOrders.map((o: any) => ({ label: o.invoice_number, value: String(o.id) }));
    const hasInvalidAccepted = products.some(p => {
        const ordered = p.ordered_quantity || 0;
        const accepted = p.acceptedAmount;
        return accepted !== undefined && accepted > ordered;
    });

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Invoice Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add the purchase invoice information</p>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='flex flex-col w-full gap-4'>
                        <div className='inline-flex w-full gap-3'>
                            <Dropdown
                                label='Invoice Number'
                                className="w-full font-medium"
                                placeholder={selectedPurchaseOrder?.invoice_number || 'Choose from purchase order'}
                                options={orderOptions}
                                value={selectedPurchaseOrder?.id || ''}
                                onChange={handleInvoiceChange}
                                required
                            />
                            <CustomInput
                                label='Supplier'
                                intent={'disabled'}
                                placeholder='Please choose an invoice'
                                className='w-full text-grey-2'
                                value={selectedPurchaseOrder?.supplier_name || ''}
                                disabled
                            />
                        </div>
                    </div>
                    
                    {selectedPurchaseOrder && (
                        <>
                            <div className='inline-flex w-full gap-3'>
                                <CustomInput
                                    label='Order date'
                                    intent={'disabled'}
                                    placeholder='Please choose an invoice'
                                    className='w-full text-grey-2'
                                    value={new Date(selectedPurchaseOrder.order_date).toLocaleDateString()}
                                    disabled
                                />
                                <DateInput
                                    label="Date receipt"
                                    placeholder="Choose date receipt"
                                    value={receiptDate}
                                    onChange={setReceiptDate}
                                />
                            </div>

                            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className="w-full flex flex-col gap-1">
                                <h1 className="font-semibold text-base text-primary-blue">Payment Information</h1>
                                <p className="text-sm font-medium text-grey-desc">You have to a total  (Rp.<span className='text-primary-orange'>{formatRupiah(selectedPurchaseOrder.total_amount)}</span>)</p>
                            </div>

                            <div className='inline-flex w-full gap-3'>
                                {
                                    (() => {
                                        const totalNum = Number(selectedPurchaseOrder.total_amount || 0);
                                        const dpRaw = selectedPurchaseOrder.dp_amount;
                                        const dpNum = dpRaw === null || dpRaw === undefined ? null : Number(dpRaw);
                                        const updateNum = Number(updateAmount || 0);

                                        // Amount left calculation only when dp exists
                                        const amountLeftNum = dpNum === null ? null : (totalNum - (dpNum + updateNum));

                                        return (
                                            <>
                                                <CustomInput
                                                    label='Your down payment (Rp)'
                                                    className='w-full'
                                                    intent={'disabled'}
                                                    value={dpNum === null ? '-' : formatRupiah(dpNum)}
                                                    disabled
                                                />

                                                <CustomInput
                                                    label='Update payment amount (Rp)'
                                                    intent={dpNum === null ? 'disabled' : 'default'}
                                                    type='text'
                                                    inputMode='numeric'
                                                    className='w-full text-grey-2'
                                                    placeholder={dpNum === null ? 'This order has full payment' : 'Please enter the updated payment amount'}
                                                    value={dpNum === null ? 'This order has full payment' : updateAmount}
                                                    onChange={dpNum === null ? undefined : (e) => setUpdateAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                                    disabled={dpNum === null}
                                                    required={dpNum !== null}
                                                />

                                                <CustomInput
                                                    label='Amount left (Rp)'
                                                    intent={'disabled'}
                                                    placeholder='0.00'
                                                    className='w-full text-grey-2'
                                                    value={
                                                        dpNum === null
                                                        ? 'This order has full payment'
                                                        : (amountLeftNum !== null && amountLeftNum <= 0
                                                            ? 'The invoice has been paid in full.'
                                                            : formatRupiah(amountLeftNum ?? 0))
                                                    }
                                                    disabled
                                                />
                                            </>
                                        );
                                    })()
                                }
                            </div>
                            
                            <DateInput
                                label="Payment due date"
                                placeholder="Choose due date"
                                value={paymentDueDate}
                                onChange={setPaymentDueDate}
                            />
                            
                            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full justify-start items-center'>
                                <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                            </div>
                            {fetchError && (
                                <div className="w-full py-2 text-sm text-state-red inline-flex items-center gap-3">
                                    <div>{fetchError}</div>
                                    <button type="button" className="text-primary-blue underline" onClick={() => handleInvoiceChange(String(selectedPurchaseOrder.id))}>Reload products</button>
                                </div>
                            )}
                    
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
                        {products.length === 0 ? (
                            <div className="w-full text-center py-8 text-grey-desc font-medium">This order has no products added yet.</div>
                        ) : (
                            products.map((p, index) => (
                                <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-10">{index + 1}.</div>
                                    <div className="w-full">{p.material_name}</div>
                                    <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                    <div className="min-w-10">{p.unit_name}</div>
                                    <div className="w-full">
                                        <CustomInput
                                            className='w-full'
                                            placeholder='Ex: 10'
                                            value={p.acceptedAmount === undefined ? '' : String(p.acceptedAmount)}
                                            onChange={(e) => handleAcceptedAmountChange(p.id, e.target.value === '' ? undefined : Number(e.target.value || 0))}
                                        />
                                    </div>
                                    <div className="w-full">
                                        {
                                            (() => {
                                                const ordered = p.ordered_quantity || 0;
                                                const accepted = p.acceptedAmount;
                                                if (accepted === undefined) return <span>{ordered}</span>;
                                                const left = ordered - accepted;
                                                if (accepted > ordered) return <span className="text-state-red">Error: More than being ordered!</span>;
                                                return <span>{left >= 0 ? left : 0}</span>;
                                            })()
                                        }
                                    </div>
                                    <div className="w-full">{formatRupiah((p.acceptedAmount || 0) * (p.price_per_unit || 0))}</div>                         
                                </div>
                            ))
                        )}
                    </div>
                    <div className="self-stretch w-full border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                    <div className='w-full justify-end flex flex-col items-end gap-3'>
                        {products.map((p, index) => (
                            <div key={index} className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                                Product: {p.material_name}
                                <span>Rp {formatRupiah((p.acceptedAmount || 0) * (p.price_per_unit || 0))}</span>
                            </div>
                        ))}
                        <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-primary-orange'>
                            <div className='text-grey-desc'>Subtotal</div>
                            <span>{formatRupiah(calculateSubtotal())}</span>
                        </div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            <div className='inline-flex gap-1'>Discount <span className='text-primary-orange'>{Number(derived.discountPercent || 0).toFixed(2)}%</span>:</div>
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
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            <div className='text-grey-desc'>From total value of</div>
                            <span>{formatRupiah(selectedPurchaseOrder.total_amount)}</span>
                        </div>
                    </div>
                    </>
                    )}
                    <CustomButton
                        className='mt-3'
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading || hasInvalidAccepted}
                    >
                        {loading ? 'Saving...' : 'Save Purchase Invoice'}
                    </CustomButton>
                </form>
            </div>
        </div>
    );
}