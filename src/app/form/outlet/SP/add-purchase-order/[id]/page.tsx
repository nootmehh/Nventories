'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Toggle from "@/components/ui/toggle"
import Dropdown from '@/components/ui/dropdown';
import { DateInput } from '@/components/ui/dateInput';
import ProductModal from '@/components/modal/productModal';

import {
  Plus,
  Trash,
} from 'lucide-react';
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
}

export default function AddPurchaseOrderPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
    const [invoiceProcess, setInvoiceProcess] = useState('Not Invoiced');
    const [deliveryStatus, setDeliveryStatus] = useState('Pending');
    
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [hasDownPayment, setHasDownPayment] = useState(false);
    const [dpAmount, setDpAmount] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [feePercentage, setFeePercentage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const invoiceOptions = [
    { label: 'Draft', value: 'Draft' }, 
    { label: 'Sent', value: 'Sent' },
    { label: 'Paid', value: 'Paid' },
    ];

    // PERBAIKAN: Sesuaikan dengan ENUM database
    const deliveryOptions = [
        { label: 'Pending', value: 'Pending' },
         { label: 'Partially Delivered', value: 'Partially Delivered' },
         { label: 'Fully Delivered', value: 'Fully Delivered' },
        { label: 'Cancelled', value: 'Cancelled' },
    ];
    
    const supplierOptions = suppliers.map((s: any) => ({ label: s.supplier_name, value: String(s.id) }));

    // PERBAIKAN: Gunakan fungsi format yang lebih robust
    const formatRupiah = (value: string | number) => {
        if (value === null || value === undefined || value === '') return '';
        const numberValue = Number(String(value).replace(/[^0-9,]/g, '').replace(',', '.'));
        
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numberValue);
    };
    
    const calculateSubtotal = () => products.reduce((acc, p) => acc + (p.quantity * p.price_per_unit), 0);
    const calculateDiscountAmount = () => (calculateSubtotal() * (Number(discountPercentage) || 0)) / 100;
    const calculateFeeAmount = () => (calculateSubtotal() * (Number(feePercentage) || 0)) / 100;
    const calculateTotal = () => calculateSubtotal() - calculateDiscountAmount() + calculateFeeAmount();

    const handleSaveProducts = (selectedProducts: any[]) => {
        setProducts(selectedProducts.map(p => ({
        ...p,
        quantity: 1,
        price_per_unit: p.price_per_unit // adjust ke nilai asli
    })));
    };
    
    const handleRemoveProduct = (productId: number) => {
        setProducts(products.filter(p => p.id !== productId));
    };

    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        setProducts(products.map(p => (
            p.id === productId ? { ...p, quantity: newQuantity } : p
        )));
    };

    const fetchSuppliers = async () => {
        setInitialLoading(true);
        if (!user?.business?.id || !outletId) {
            router.push('/outlet');
            return;
        }
        try {
            const response = await fetch(`/api/outlets/suppliers/list?outletId=${outletId}`);
            const result = await response.json();
            if (response.ok) {
                setSuppliers(result.data);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            setSuppliers([]);
        } finally {
            setInitialLoading(false);
        }
    };
    
    useEffect(() => {
        if (outletId && user?.business?.id) {
            fetchSuppliers();
        }
    }, [outletId, user?.business?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // Validasi form awal
  const isFormIncomplete =
    !outletId ||
    !invoiceNumber ||
    !supplierId ||
    !orderDate ||
    products.length === 0;

  if (isFormIncomplete) {
    alert('Please fill in all required fields and add at least one product.');
    setLoading(false);
    return;
  }

  try {
    const payload = {
      outletId,
      invoiceNumber,
      supplierId: Number(supplierId),
      orderDate: orderDate?.toISOString().split('T')[0] || null,
      invoiceProcess,
      deliveryStatus,
      totalAmount: calculateTotal(),
      dpAmount: hasDownPayment
        ? Number(dpAmount.replace(/[^0-9]/g, '')) || 0
        : 0,
      discountAmount: calculateDiscountAmount() || 0,
      taxAmount: calculateFeeAmount() || 0,
      products,
    };

    const response = await fetch('/api/outlets/SP/porder/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add purchase order.');
    }

    alert(data.message || 'Purchase order added successfully!');
    router.push(`/outlet/SP/purchase-order/${outletId}`);
  } catch (error) {
    console.error('Failed to add purchase order:', error);
    alert(
      error instanceof Error
        ? error.message
        : 'Connection error. Failed to add purchase order.'
    );
  } finally {
    setLoading(false);
  }
};

    
    if (initialLoading) {
        return <div>Loading form data...</div>;
    }
    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">            
                        {showProductModal && (
                            <ProductModal
                                isOpen={showProductModal}
                                onCloseAction={() => setShowProductModal(false)}
                                onSaveAction={handleSaveProducts}
                                outletId={outletId}
                            />
                        )}

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Stock Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add the purchase order information</p>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='flex flex-col w-full gap-4'>
                        <div className='inline-flex w-full gap-3'>
                            <CustomInput
                                type="text"
                                label="Invoice No."
                                placeholder="Ex: INV-123"
                                className="w-full"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                required
                            />
                            {suppliers.length > 0 ? (
                                <Dropdown
                                    label='Supplier'
                                    className="w-full font-medium"
                                    placeholder="Choose supplier"
                                    options={supplierOptions}
                                    value={supplierId}
                                    onChange={setSupplierId}
                                    required
                                />
                            ) : (
                                <div className="w-full">
                                    <p className="text-sm font-medium text-grey-desc mb-1">Supplier</p>
                                    <p className="text-sm text-red-500">No suppliers found for this outlet.</p>
                                    <Link href={`/form/outlet/add-supplier/${outletId}`}>
                                      <span className="text-primary-orange font-semibold">Add one here</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='inline-flex w-full gap-3'>
                        <DateInput
                            label="Date order"
                            placeholder="Choose date order"
                            value={orderDate}
                            onChange={setOrderDate}
                        />
                        <Dropdown
                            label='Invoice Process'
                            className="w-full"
                            placeholder="Choose Invoice Process"
                            options={invoiceOptions}
                            value={invoiceProcess}
                            onChange={setInvoiceProcess}
                        />
                    </div>
                    <Dropdown
                        label='Delivery Status'
                        className="w-full"
                        placeholder="Choose status"
                        options={deliveryOptions}
                        value={deliveryStatus}
                        onChange={setDeliveryStatus}
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
                            onClick={() => setShowProductModal(true)}
                        >Add Product</CustomButton>
                    </div>
                    
                    <div className='flex flex-col gap-0'>
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justif-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                            <div className="min-w-10">No.</div>
                            <div className="w-full">Product</div>
                            <div className="w-full">Amount</div>
                            <div className="w-full">Unit</div>
                            <div className="w-full">Price per unit (Rp)</div>
                            <div className="w-full">Total (Rp)</div>
                            <div className='collapse'>
                                <CustomButton variant="ghost" size="smallIcon" Icon={Trash} />
                            </div>
                        </div>
                        {products.length === 0 ? (
                            <div className="w-full text-center py-8 text-grey-desc font-medium">No products added yet.</div>
                        ) : (
                            products.map((p, index) => (
                                <div key={index} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                    <div className="min-w-10">{index + 1}.</div>
                                    <div className="w-full">{p.material_name}</div>
                                    <div className="w-full">
                                        <CustomInput 
                                          type="number"
                                          className='w-full text-grey-2'
                                          value={p.quantity}
                                          onChange={(e) => {
                                              const newQuantity = Number(e.target.value);
                                              setProducts(products.map(product =>
                                                product.id === p.id ? { ...product, quantity: newQuantity } : product
                                              ));
                                          }}
                                        />
                                    </div>
                                    <div className="w-full">{p.unit_name}</div>
                                    <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                    <div className="w-full">{formatRupiah(p.quantity * p.price_per_unit)}</div>
                                    <div className="flex justify-end">
                                        <CustomButton variant="ghost" size="smallIcon" Icon={Trash} onClick={() => setProducts(products.filter(prod => prod.id !== p.id))} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="self-stretch w-full border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                    <div className="text-sm font-medium text-grey-desc flex items-center gap-4">
                        <span>Has down payment ?</span>
                        <Toggle isOn={hasDownPayment} onToggle={setHasDownPayment} />
                    </div>
                    
                    <CustomInput
                        label='Down Payment Amount (Rp)'
                        className='w-full'
                        type='text'
                        inputMode='numeric'
                        intent={hasDownPayment ? 'default' : 'disabled'}
                        placeholder='0.00'
                        disabled={!hasDownPayment}
                        value={formatRupiah(dpAmount)}
                        onChange={(e) => setDpAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    />

                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            type="number"
                            label="Discount (%)"
                            placeholder="Ex: 5, 10, 15"
                            className="w-full"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(e.target.value)}
                        />
                        <CustomInput
                            label="Discount in Rupiah"
                            intent={'disabled'}
                            placeholder="Input (%) Amount"
                            className="w-full"
                            value={formatRupiah(calculateDiscountAmount())}
                            disabled
                        />
                    </div>
                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            type="number"
                            label="Fee (%)"
                            placeholder="Ex: 5, 10, 15"
                            className="w-full"
                            value={feePercentage}
                            onChange={(e) => setFeePercentage(e.target.value)}
                        />
                        <CustomInput
                            label="Fee in Rupiah"
                            intent={'disabled'}
                            placeholder="Input (%) Amount"
                            className="w-full"
                            value={formatRupiah(calculateFeeAmount())}
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
                            <div className='inline-flex gap-1'>Discount <span className='text-primary-orange'>{discountPercentage || 0}%</span>:</div>
                            <span>{formatRupiah(calculateDiscountAmount())}</span>
                        </div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-sm font-medium text-grey-desc'>
                            <div className='inline-flex gap-1'>Fee <span className='text-state-red'>{feePercentage || 0}%</span>:</div>
                            <span>{formatRupiah(calculateFeeAmount())}</span>
                        </div>
                        <div className="w-96 border-b border-white-3 inline-flex items-center justify-start text-grey-2 text-sm font-medium"></div>
                        <div className='w-96 justify-between inline-flex items-center gap-4 text-base font-medium text-primary-orange'>
                            <div className='text-grey-desc'>Total</div>
                            <span>{formatRupiah(calculateTotal())}</span>
                        </div>
                    </div>
                    <CustomButton
                        className='mt-3'
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Purchase Order'}
                    </CustomButton>
                </form>
            </div>
        </div>
    );
}