'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import "@/app/globals.css";

import { useUser } from '@/context/UserContext';
import CustomRadioButton from '@/components/ui/customRadioButton';
import Dropdown from '@/components/ui/dropdown';


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
    const [packageSize, setPackageSize] = useState('');
    const [loading, setLoading] = useState(false);
    const [productionType, setProductionType] = useState<'new' | 'existed'>('new');

    const formatRupiah = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formatted;
  };

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

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!outletId || !materialName || !sku || !unitName || !pricePerUnit) {
        alert('Please fill in all required fields.');
        setLoading(false);
        return;
    }

    if (productionType === 'new' && !packageSize) {
        alert('Please provide the package size for new production items.');
        setLoading(false);
        return;
    }

    try {
        const payload = {
            outletId,
            materialName,
            sku,
            productionType,
            packageSize: productionType === 'new' ? Number(packageSize) || 0 : undefined,
            unitName,
            pricePerUnit: Number(pricePerUnit.replace(/[^0-9]/g, '')) || 0, // Default 0 jika input kosong
            minStockReminder: Number(minStockReminder) || 0, // Default 0 jika input kosong
            openingStock: Number(openingStock) || 0, // Default 0 jika input kosong
        };
        
        const response = await fetch('/api/outlets/MS/raw-material/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Raw material added successfully!');
            router.push(`/outlet/MS/raw-material-stock/${outletId}`);
        } else {
            alert(data.message || 'Failed to add raw material.');
        }
    } catch (error) {
        console.error('Failed to add raw material:', error);
        alert('Connection error. Failed to add raw material.');
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
                        <div className="w-full flex-col flex gap-6">
                            <div className='inline-flex w-full gap-3'>
                                <CustomInput
                                label='Finished goods name'
                                placeholder="Ex: Special fried rice"
                                value={''}
                                onChange={(e) => ('')}
                            />
                                <CustomInput
                                label='SKU'
                                placeholder="Ex: SKU-123"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                            />
                            </div>
                            <div className='inline-flex w-full justify-start gap-3'>
                            <Dropdown
                            label='Unit name'
                            className="w-full"
                            placeholder="Choose unit"
                            options={UnitOptions}
                            value={unitName}
                            onChange={setUnitName}
                            />

                        <CustomInput
                            label='Minimum stock reminder'
                            className='w-64'
                            type="number"
                            placeholder="Ex: 10"
                            value={minStockReminder}
                            onChange={(e) => setMinStockReminder(e.target.value)}
                            required
                        />
                            </div>    
                        </div>
                    )}
                    <CustomInput
                        placeholder="Material Name"
                        value={materialName}
                        onChange={(e) => setMaterialName(e.target.value)}
                    />
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
            </div>
        </div>
    );
}