'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Toggle from "@/components/ui/toggle"

import { useUser } from '@/context/UserContext';
import Link from 'next/link';

interface Product {
    id: number;
    material_name: string;
    sku: string;
    unit_name: string;
    remaining_stock: number;
    price_per_unit: number;
    quantity: number;
    subtotal: number;
}

export default function ShowPurchaseOrderPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [orderDate, setOrderDate] = useState<string>('');
    const [invoiceProcess, setInvoiceProcess] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState('');
    
    const [products, setProducts] = useState<Product[]>([]);
    const [dpAmount, setDpAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [taxAmount, setTaxAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    
    const [initialLoading, setInitialLoading] = useState(true);

    const formatRupiah = (value: string | number) => {
  if (value === null || value === undefined || value === '') return '0';
  const numberValue = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^0-9.]/g, '')); // biarkan titik
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numberValue);
};

    const fetchPurchaseOrder = async () => {
        if (!orderId) {
            setInitialLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/outlets/SP/porder/show/${orderId}`);
            const result = await response.json();
            
            if (response.ok) {
                const orderData = result.data;
                setInvoiceNumber(orderData.invoice_number);
                setSupplierName(orderData.supplier_name);
                setOrderDate(orderData.order_date);
                setInvoiceProcess(orderData.invoice_process);
                setDeliveryStatus(orderData.delivery_status);
                setDpAmount(formatRupiah(orderData.dp_amount));
                setDiscountAmount(formatRupiah(orderData.discount_amount));
                setTaxAmount(formatRupiah(orderData.tax_amount));
                setTotalAmount(formatRupiah(orderData.total_amount));
                setProducts(orderData.products);
            } else {
                alert('Failed to fetch purchase order data.');
                router.push('/outlet/SP/purchase-order-list');
            }
        } catch (error) {
            console.error('Failed to fetch purchase order:', error);
            alert('Connection error. Failed to fetch purchase order.');
            router.push('/outlet/SP/purchase-order-list');
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrder();
    }, [orderId, router]);

    function calculateSubtotal(): number {
  if (!products.length) return 0;
  return products.reduce(
    (sum, product) => sum + Number(product.subtotal || 0),
    0
  );
}

function getPercent(amount: number, subtotal: number): number {
  if (!subtotal) return 0;
  return (amount / subtotal) * 100;
}

const subtotalValue = calculateSubtotal();
const discountPercent = Math.round(getPercent(Number(discountAmount.replace(/\./g, '')), subtotalValue));
const feePercent = Math.round(getPercent(Number(taxAmount.replace(/\./g, '')), subtotalValue));


    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <div className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Stock Information</h1>
                        <p className="text-sm font-medium text-grey-desc">View the purchase order details below.</p>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='flex flex-col w-full gap-4'>
                        <div className='inline-flex w-full gap-3'>
                            <CustomInput
                                intent={'disabled'}
                                type="text"
                                label="Invoice No."
                                placeholder="Ex: INV-123"
                                className="w-full"
                                value={invoiceNumber}
                                disabled
                            />
                            <CustomInput
                                intent={'disabled'}
                                label="Supplier"
                                className="w-full font-medium"
                                value={supplierName}
                                disabled
                            />
                        </div>
                    </div>
                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            intent={'disabled'}
                            label="Date in"
                            className="w-full"
                            placeholder="Ex: 2023-10-26"
                            type="text"
                            value={orderDate}
                            disabled
                        />
                        <CustomInput
                            intent={'disabled'}
                            label='Invoice Process'
                            className="w-full"
                            value={invoiceProcess}
                            disabled
                        />
                    </div>
                    <CustomInput
                        intent={'disabled'}
                        label='Delivery Status'
                        className="w-full"
                        value={deliveryStatus}
                        disabled
                    />
                            
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <div className='inline-flex w-full justify-between items-center'>
                        <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                    </div>
                    
                    <div className='flex flex-col gap-0'>
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start text-sm font-semibold uppercase gap-6 text-grey-desc">
                            <div className="min-w-10">No.</div>
                            <div className="w-full">Product</div>
                            <div className="w-full">Amount</div>
                            <div className="w-full">Unit</div>
                            <div className="w-full">Price per unit (Rp)</div>
                            <div className="w-full">Total (Rp)</div>
                        </div>
                        {products.length === 0 ? (
                            <div className="w-full text-center py-8 text-grey-desc font-medium">No products added yet.</div>
                        ) : (
                            products.map((p, index) => (
                                <div key={p.id} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-10">{index + 1}.</div>
                                    <div className="w-full">{p.material_name}</div>
                                    <div className="w-full">{p.quantity}</div>
                                    <div className="w-full">{p.unit_name}</div>
                                    <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                    <div className="w-full">{formatRupiah(p.subtotal)}</div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="self-stretch w-full border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                    <div className="text-sm font-medium text-grey-desc flex items-center gap-4">
                        <span>Down payment :</span>
                    </div>
                    
                    <CustomInput
                        label='Down Payment Amount (Rp)'
                        className='w-full'
                        type='text'
                        inputMode='numeric'
                        intent={'disabled'}
                        placeholder='0.00'
                        disabled
                        value={dpAmount}
                    />

                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            intent={'disabled'}
                            label="Discount (%)"
                            className="w-full"
                            value={discountPercent.toFixed(2)}
                            disabled
                        />
                        <CustomInput
                            label="Discount in Rupiah"
                            intent={'disabled'}
                            placeholder="Input (%) Amount"
                            className="w-full"
                            value={discountAmount}
                            disabled
                        />
                    </div>
                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            label="Fee (%)"
                            className="w-full"
                            value={feePercent.toFixed(2)}
                            disabled
                            intent={'disabled'}
                        />
                        <CustomInput
                            label="Fee in Rupiah"
                            intent={'disabled'}
                            placeholder="Input (%) Amount"
                            className="w-full"
                            value={taxAmount}
                            disabled
                        />
                    </div>
                    <div className="self-stretch w-full border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                    <div className='w-full justify-end flex flex-col items-end gap-3'>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            Subtotal (Rp) :
                            <span>{formatRupiah(calculateSubtotal())}</span>
                        </div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            <div className='inline-flex gap-1'>Discount <span className='text-primary-orange'>{discountPercent.toFixed(2)}%</span>:</div>
                            <span>- {discountAmount}</span>
                        </div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            <div className='inline-flex gap-1'>Fee <span className='text-state-red'>{feePercent.toFixed(2)}%</span>:</div>
                            <span>+ {taxAmount}</span>
                        </div>
                        <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-base font-medium text-primary-orange'>
                            <div className='text-grey-desc'>Total</div>
                            <span>{totalAmount}</span>
                        </div>
                    </div>
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