'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import "@/app/globals.css";

import { useUser } from '@/context/UserContext';
import Dropdown from '@/components/ui/dropdown';


export default function EditRawMaterialPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const materialId = params.id as string;

    const [materialName, setMaterialName] = useState('');
    const [sku, setSku] = useState('');
    const [unitName, setUnitName] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [minStockReminder, setMinStockReminder] = useState('');
    const [openingStock, setOpeningStock] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const formatRupiah = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formatted;
  };

  const handleRupiah = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPricePerUnit(formatRupiah(value));
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

useEffect(() => {
        const fetchRawMaterialData = async () => {
            if (!materialId) {
                setInitialLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/outlets/MS/raw-material/edit/${materialId}`);
                const result = await response.json();
                if (response.ok) {
                    const materialData = result.data;
                    setMaterialName(materialData.material_name || '');
                    setSku(materialData.sku || '');
                    setUnitName(materialData.unit_name || '');
                    setPricePerUnit(String(materialData.price_per_unit || ''));
                    setMinStockReminder(String(materialData.min_stock_reminder || ''));
                    setOpeningStock(String(materialData.opening_stock || ''));
                } else {
                    alert('Failed to fetch raw material data.');
                    router.push(`/outlet/MS/raw-material-stock/${user?.business?.mainOutlet?.id}`);
                }
            } catch (error) {
                console.error('Failed to fetch raw material:', error);
                alert('Connection error. Failed to fetch raw material.');
                router.push(`/outlet/MS/raw-material-stock/${user?.business?.mainOutlet?.id}`);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchRawMaterialData();
    }, [materialId, router, user]);
    
 const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Perbaikan validasi
            if (!materialName || !sku || !unitName || !pricePerUnit || !minStockReminder) {
                alert('Please fill in all required fields.');
                setLoading(false);
                return;
            }
            const payload = {
                materialName,
                sku,
                unitName,
                // Perbaikan: Pastikan pricePerUnit dikirim sebagai angka
                pricePerUnit: Number(pricePerUnit.replace(/[^0-9]/g, '')),
                minStockReminder: Number(minStockReminder),
                // Perbaikan: openingStock tidak perlu dikirim
                // openingStock: Number(openingStock), 
            };
            const response = await fetch(`/api/outlets/MS/raw-material/update/${materialId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Raw material updated successfully!');
                router.push(`/outlet/MS/raw-material-stock/${user?.business?.mainOutlet?.id}`);
            } else {
                alert(data.message || 'Failed to update raw material.');
            }
        } catch (error) {
            console.error('Failed to update raw material:', error);
            alert('Connection error. Failed to update raw material.');
        } finally {
            setLoading(false);
        }
    };


    if (initialLoading) {
        return <div>Loading outlet data...</div>;
    }
    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col justify-center items-center">

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form className="w-full flex flex-col gap-6" onSubmit={handleSubmitUpdate}>
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Raw Material Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add a raw material.</p>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='flex flex-col w-full gap-4'>
                        <div className='inline-flex w-full gap-3'>
                            <CustomInput
                                type="text"
                                label="Raw Material Name"
                                placeholder="Ex: Sugar, Rice, etc."
                                className="w-full"
                                value={materialName}
                                onChange={(e) => setMaterialName(e.target.value)}
                                required
                            />
                            <CustomInput
                                type="text"
                                label="SKU"
                                placeholder="Ex: SKU-001"
                                className="w-full"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                required
                                />
                        </div>
                    </div>
                    <div className='flex flex-col w-full gap-x-0'>
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex  justif-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                            <div className="w-full">Unit Name</div>
                            <div className="w-full">Price per unit (Rp)</div>
                            <div className="w-full">Minimum Stock Reminder</div>
                        </div>
                        <div className="px-3 py-4 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2">
                            <div className="w-full">
                                <Dropdown
                                className="w-full font-medium"
                                placeholder="Choose unit"
                                options={UnitOptions}
                                value={unitName}
                                onChange={setUnitName}
                            />
                            </div>
                            <div className="w-full">
                                <CustomInput
                                className='w-full'
                                type="text"
                                inputMode='numeric'
                                placeholder="Ex: 1.000"
                                value={pricePerUnit}
                                onChange={handleRupiah}
                                required
                            />
                            </div>
                            <div className="w-full">
                                <CustomInput
                                className='w-full'
                                type="number"
                                placeholder="Ex: 10"
                                value={minStockReminder}
                                onChange={(e) => setMinStockReminder(e.target.value)}
                                required
                            />
                            </div>
                            
                        </div>
                    </div>           
                    <div className="flex justify-end mt-8">
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Raw Material'}
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}