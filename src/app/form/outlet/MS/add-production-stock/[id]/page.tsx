'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import "@/app/globals.css";

import { useUser } from '@/context/UserContext';
import CustomRadioButton from '@/components/ui/customRadioButton';
import Dropdown from '@/components/ui/dropdown';
import { Plus, Trash } from 'lucide-react';
import ProductModal from '@/components/modal/productModal';


export default function AddProductionStockPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [materialName, setMaterialName] = useState('');
    const [sku, setSku] = useState('');
    const [unitName, setUnitName] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [minStockReminder, setMinStockReminder] = useState('');
    const [openingStock, setOpeningStock] = useState('');
    // packageSize removed — not used in current UI
    const [loading, setLoading] = useState(false);
    const [productionType, setProductionType] = useState<'new' | 'existed'>('new');
    const [showProductModal, setShowProductModal] = useState(false);
    const [products, setProducts] = useState<Array<{ id: string | number; material_name: string; quantity: number; unit_name: string; remaining_stock?: number; price_per_unit: number }>>([]);
    const [finishedName, setFinishedName] = useState('');
    const [finishedSku, setFinishedSku] = useState('');
    const [finishedUnit, setFinishedUnit] = useState('');
    const [finishedAmount, setFinishedAmount] = useState<number>(1);
    const [finishedOptions, setFinishedOptions] = useState<Array<{ label: string; value: string; sku?: string; unit_name?: string; product_name?: string }>>([]);

    type LocalProduct = { id: string | number; material_name: string; quantity?: number; unit_name: string; remaining_stock?: number; price_per_unit: number };

    const handleAddProducts = (selected: LocalProduct[]) => {
        setProducts(prev => {
            const existing = new Set(prev.map(p => String(p.id)));
            const toAdd = selected
                .map(s => ({ id: s.id, material_name: s.material_name, quantity: s.quantity || 1, unit_name: s.unit_name, remaining_stock: s.remaining_stock != null ? Number(s.remaining_stock) : 0, price_per_unit: s.price_per_unit }))
                .filter(s => !existing.has(String(s.id)));
            return [...prev, ...toAdd];
        });
        setShowProductModal(false);
    };

    const formatNumber = (value: number | undefined | null) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
    };

        const formatRupiah = (value: string | number) => {
        const str = typeof value === 'number' ? String(value) : value || '';
        const cleaned = str.replace(/[^0-9]/g, '');
        const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return formatted;
    };

        // whether user has entered finished goods info in the "Add new finished goods" section
        const hasFinishedInfo = Boolean(finishedName || finishedSku || finishedUnit);

  const UnitOptions = [
  // Berat
  { label: 'Kg', value: 'Kg' },
  { label: 'Gram', value: 'Gram' },
  { label: 'Mg', value: 'Mg' },
  { label: 'Ton', value: 'Ton' },
  { label: 'Ons', value: 'Ons' },
  { label: 'Pound (lb)', value: 'Pound' },

  // Volume
  { label: 'Liter', value: 'Liter' },
  { label: 'Milliliter (ml)', value: 'Milliliter' },
  { label: 'Gallon', value: 'Gallon' },

  // Panjang
  { label: 'Meter', value: 'Meter' },
  { label: 'Centimeter (cm)', value: 'Centimeter' },
  { label: 'Millimeter (mm)', value: 'Millimeter' },
  { label: 'Inch', value: 'Inch' },
  { label: 'Foot (ft)', value: 'Foot' },

  // Jumlah
  { label: 'Pcs', value: 'Pcs' },
  { label: 'Unit', value: 'Unit' },
  { label: 'Set', value: 'Set' },
  { label: 'Pack', value: 'Pack' },
  { label: 'Box', value: 'Box' },
  { label: 'Dozen (lusin)', value: 'Dozen' },
  { label: 'Roll', value: 'Roll' },
  { label: 'Bottle', value: 'Bottle' },
  { label: 'Bag', value: 'Bag' },
  { label: 'Can', value: 'Can' },
  { label: 'Jar', value: 'Jar' },

  // Lainnya
  { label: 'Carton', value: 'Carton' },
  { label: 'Tube', value: 'Tube' },
  { label: 'Sheet', value: 'Sheet' },
  { label: 'Bundle', value: 'Bundle' },
  { label: 'Sack', value: 'Sack' },
  { label: 'Strip', value: 'Strip' },
  { label: 'Pair', value: 'Pair' },
];

  const handleRupiah = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPricePerUnit(formatRupiah(value));
  };

    // Load finished goods for "existed" production type
    useEffect(() => {
        if (!outletId) return;
        const ac = new AbortController();
        async function loadFinished() {
            try {
                const res = await fetch(`/api/outlets/MS/finished-goods/list?outletId=${encodeURIComponent(outletId)}`, { signal: ac.signal, headers: { Accept: 'application/json' } });
                if (!res.ok) {
                    setFinishedOptions([]);
                    return;
                }
                const data = await res.json();
                const opts = Array.isArray(data)
                    ? data.map((fg: any) => ({
                        label: fg.product_name ? `${fg.product_name} (${fg.sku ?? ''})` : String(fg.sku ?? fg.id),
                        value: String(fg.id),
                        sku: fg.sku,
                        unit_name: fg.unit_name,
                        product_name: fg.product_name,
                    }))
                    : [];
                setFinishedOptions(opts);
            } catch (err) {
                if (!ac.signal.aborted) setFinishedOptions([]);
            }
        }
        loadFinished();
        return () => ac.abort();
    }, [outletId]);

    // Clear finished fields when switching to 'new'
    useEffect(() => {
        if (productionType === 'new') {
            setMaterialName('');
            setFinishedName('');
            setFinishedSku('');
            setFinishedUnit('');
        }
    }, [productionType]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // basic checks
    if (!outletId) {
        alert('Missing outlet id.');
        setLoading(false);
        return;
    }

    // ensure there is at least one material selected
    if (!Array.isArray(products) || products.length === 0) {
        alert('Please add at least one raw material for production.');
        setLoading(false);
        return;
    }

    // validate finished goods when creating new finished product
    if (productionType === 'new') {
        if (!finishedName || !finishedSku || !finishedUnit || !finishedAmount) {
            alert('Please add finished goods information first!');
            setLoading(false);
            return;
        }
    }

    // ensure product quantities are valid
    const invalidQty = products.some(p => !p.quantity || Number(p.quantity) <= 0);
    if (invalidQty) {
        alert('Please ensure all material quantities are greater than zero.');
        setLoading(false);
        return;
    }

    try {
        // build payload for production run
        const productsPayload = products.map(p => ({
            raw_material_id: p.id,
            quantity: p.quantity,
            price_per_unit: p.price_per_unit
        }));

        const payload: any = {
            outletId,
            productionType,
            finishedAmount,
            products: productsPayload,
        };
        if (productionType === 'existed') {
            payload.finishedGoodId = materialName || null; // materialName holds selected finished good id
        } else {
            payload.finishedName = finishedName;
            payload.finishedSku = finishedSku;
            payload.finishedUnit = finishedUnit;
        }

        const response = await fetch('/api/outlets/MS/stock-production/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Production saved successfully!');
            router.push(`/outlet/MS/stock-production-list/${outletId}`);
        } else {
            alert(data.message || 'Failed to save production.');
        }
    } catch (error) {
        console.error('Failed to save production:', error);
        alert('Connection error. Failed to save production.');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col justify-center items-center">

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Add Production Data</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add a new production list.</p>
                    </div>

                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='w-full inline-flex gap-3'>
                        <CustomRadioButton
                            name="productionType"
                            value="new"
                            checked={productionType === 'new'}
                            onChange={(value) => setProductionType(value as 'new' | 'existed')}
                            title="Create new finished goods list"
                            description="Create a new list for finished goods."
                        />
                        <CustomRadioButton
                            name="productionType"
                            value="existed"
                            checked={productionType === 'existed'}
                            onChange={(value) => setProductionType(value as 'new' | 'existed')}
                            title="Use existed finished goods"
                            description="Choose from existed goods, on production"
                        />
                    </div>
                    
                {productionType === 'new' && (
                        <div className="w-full flex-col flex gap-6 p-6 border-2 border-white-3 bg-white-1 hover:bg-white-2 rounded-md">
                        
                        <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Add Finished Goods</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add a new finished goods item.</p>
                        </div>
                        {/* Add new finished goods */}
                        <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                            <div className='inline-flex w-full gap-3'>
                                <CustomInput
                                label='Finished goods name'
                                placeholder="Ex: Special fried rice"
                                value={finishedName}
                                onChange={(e) => setFinishedName(e.target.value)}
                            />
                                <CustomInput
                                label='SKU'
                                placeholder="Ex: FG-SKU-123"
                                value={finishedSku}
                                onChange={(e) => setFinishedSku(e.target.value)}
                            />
                            </div>
                            <div className='inline-flex w-full justify-start gap-3'>
                            <Dropdown
                            label='Unit name'
                            className="w-full"
                            placeholder="Choose unit"
                            options={UnitOptions}
                            value={finishedUnit}
                            onChange={setFinishedUnit}
                            />

                        <CustomInput
                            label='Minimum stock reminder'
                            className='w-full'
                            type="number"
                            placeholder="Ex: 10"
                            value={minStockReminder}
                            onChange={(e) => setMinStockReminder(e.target.value)}
                            required
                        /></div>    
                        </div>
                    )}

                    {productionType === 'existed' && (
                        <Dropdown
                            label='Finished Goods'
                            placeholder="Choose finished goods"
                            value={materialName}
                            onChange={(val) => {
                                // find selected finished good and populate fields
                                setMaterialName(String(val || ''));
                                const sel = finishedOptions.find(o => o.value === String(val));
                                if (sel) {
                                    setFinishedName(sel.product_name || '');
                                    setFinishedSku(sel.sku || '');
                                    setFinishedUnit(sel.unit_name || '');
                                } else {
                                    setFinishedName('');
                                    setFinishedSku('');
                                    setFinishedUnit('');
                                }
                            }}
                            options={finishedOptions}
                        />
                    )}
                    <div className='inline-flex w-full justify-between items-center'>
                        <p className='font-medium text-sm text-grey-desc'>Stock Raw Material</p>
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
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                        {/* Raw Material Table Title */}
                            <div className="min-w-10">No.</div>
                            <div className="w-full">Product</div>
                            <div className="w-full">Amount</div>
                            <div className="w-full">Unit</div>
                            <div className="w-full">Remaining stock</div>
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
                            // Raw Material Content
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
                                    <div className='w-full'>{formatNumber(p.remaining_stock)}</div>
                                    <div className="w-full">{formatRupiah(p.price_per_unit)}</div>
                                    <div className="w-full">{formatRupiah(p.quantity * p.price_per_unit)}</div>
                                    <div className="flex justify-end">
                                        <CustomButton variant="ghost" size="smallIcon" Icon={Trash} onClick={() => setProducts(products.filter(prod => prod.id !== p.id))} />
                                    </div>
                                </div>
                            ))
                            )}
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    
                    <div className='inline-flex w-full justify-between items-center'>
                        <p className='font-medium text-sm text-grey-desc'>Finished Goods</p>
                    </div>
                    {/* <FinishedGoodsTable /> */}
                    <div className='flex flex-col gap-0'>
                        <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                            <div className="w-full">Finished Goods</div>
                            <div className="w-full">SKU</div>
                            <div className="w-full">Amount</div>
                            <div className="w-full">Unit</div>
                            <div className="w-full">Total Cost (Rp)</div>
                            <div className='collapse'>
                                <CustomButton variant="ghost" size="smallIcon" Icon={Trash} />
                            </div>
                    </div>
                    {/* <FinishedGoodsContent /> */}
                    <div className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                        <div className="w-full">{hasFinishedInfo ? finishedName : '-'}</div>
                        <div className="w-full">{hasFinishedInfo ? finishedSku : '-'}</div>
                        <div className="w-full">
                            {hasFinishedInfo ? (
                                <CustomInput
                                    type="number"
                                    className='w-full text-grey-2'
                                    value={finishedAmount}
                                    onChange={(e) => setFinishedAmount(Number(e.target.value) || 0)}
                                />
                            ) : (
                                '-'
                            )}
                        </div>
                        <div className="w-full">{hasFinishedInfo ? finishedUnit : '-'}</div>
                        <div className="w-full">{hasFinishedInfo ? formatRupiah(products.reduce((acc, it) => acc + (it.quantity * it.price_per_unit), 0)) : '-'}</div>
                        <div className='collapse'>
                            {hasFinishedInfo ? <CustomButton variant="ghost" size="smallIcon" Icon={Trash} /> : null}
                        </div>
                    </div>
                    </div>
                    <div className="flex justify-end mt-8">
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >{loading ? 'Saving...' : productionType === 'new' ? 'Save New Production' : 'Save Stock Production'}
                        </CustomButton>
                    </div>
                </form>
                <ProductModal isOpen={showProductModal} onCloseAction={() => setShowProductModal(false)} onSaveAction={handleAddProducts} outletId={outletId} />
            </div>
        </div>
    );
}