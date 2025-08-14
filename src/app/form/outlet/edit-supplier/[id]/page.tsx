'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomInput } from "@/components/ui/input";
import { CustomButton } from "@/components/ui/customButton";
import { useUser } from '@/context/UserContext';
import "@/app/globals.css";
import { Trash } from 'lucide-react';

export default function EditSupplierPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const supplierId = params.id as string;

    const [supplierCode, setSupplierCode] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    // State untuk form utama
    const [editForm, setEditForm] = useState({
      supplierCode: '',
      supplierName: '',
      phoneNumber: '',
      email: '',
      address: '',
      province: '',
      city: '',
      description: '',
    });

    useEffect(() => {
        const fetchSupplierData = async () => {
            if (!supplierId) {
                setInitialLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/outlets/suppliers/edit/${supplierId}`);
                const result = await response.json();
                if (response.ok) {
                    const supplierData = result.data;
                    setSupplierCode(supplierData.supplier_code || '');
                    setSupplierName(supplierData.supplier_name || '');
                    setPhoneNumber(supplierData.phone_number || '');
                    setEmail(supplierData.email || '');
                    setAddress(supplierData.address || '');
                    setProvince(supplierData.province || '');
                    setCity(supplierData.city || '');
                    setDescription(supplierData.description || '');
                } else {
                    alert('Failed to fetch supplier data.');
                    router.push(`/outlet/supplier-list/${user?.business?.mainOutlet?.id}`);
                }
            } catch (error) {
                console.error('Failed to fetch supplier:', error);
                alert('Connection error. Failed to fetch supplier.');
                router.push(`/outlet/supplier-list/${user?.business?.mainOutlet?.id}`);
            } finally {
                setInitialLoading(false);
            }
        };
        
        fetchSupplierData();
    }, [supplierId, router, user]);

   const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (!supplierCode || !supplierName || !address) {
            alert('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        const payload = {
            supplierCode,
            supplierName,
            phoneNumber,
            email,
            address,
            province,
            city,
            description,
            outletId: user?.business?.mainOutlet?.id,
        };

        const response = await fetch(`/api/outlets/suppliers/update/${supplierId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Supplier updated successfully!');
            router.push(`/outlet/supplier-list/${user?.business?.mainOutlet?.id}`);
        } else {
            alert(data.message || 'Failed to update supplier.');
        }
    } catch (error) {
        console.error('Failed to update supplier:', error);
        alert('Connection error. Failed to update supplier.');
    } finally {
        setLoading(false);
    }
};
const handleDeleteSupplier = async () => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/outlets/suppliers/delete/${supplierId}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Supplier deleted successfully!');
                router.push(`/outlet/supplier-list/${user?.business?.mainOutlet?.id}`);
            } else {
                alert(data.message || 'Failed to delete supplier.');
            }
        } catch (error) {
            console.error('Failed to delete supplier:', error);
            alert('Connection error. Failed to delete supplier.');
        } finally {
            setLoading(false);
        }
    };
    if (initialLoading) {
        return <div>Loading supplier data...</div>;
    }

    return (
        <div className="w-full self-stretch pt-16 pb-8 bg-white-2 flex flex-col justify-center items-center">            
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form onSubmit={handleSubmitUpdate} className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Supplier Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add a new supplier.</p>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                    <div className='flex flex-col w-full gap-4'>
                        <div className='inline-flex w-full gap-3'>
                            <CustomInput
                                type="text"
                                label="Supplier Code"
                                placeholder="Add supplier code"
                                className="w-full"
                                value={supplierCode}
                                onChange={(e) => setSupplierCode(e.target.value)}
                                required
                            />
                            <CustomInput
                                type="text"
                                label="Supplier Name"
                                placeholder="Add supplier name"
                                className="w-full"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <CustomInput
                        type="text"
                        label="Phone Number"
                        placeholder="Supplier phone number"
                        className="w-full"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                    <CustomInput
                        type="email"
                        label="Email"
                        placeholder="Supplier email"
                        className="w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    
                    <CustomInput
                        type="text"
                        label="Full address"
                        placeholder="Supplier full outlet address"
                        className="w-full"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />
                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            type="text"
                            label="Province"
                            placeholder="Your outlet province"
                            className="w-full"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            required
                        />
                        <CustomInput
                            type="text"
                            label="City"
                            placeholder="Your outlet city"
                            className="w-full"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                    </div>
                    
                    <CustomInput
                        type="text"
                        label="Description"
                        placeholder="Description about the supplier"
                        className="w-full"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    
                    <div className="flex justify-end mt-8 gap-3">
                        <CustomButton
                                type="button"
                                variant="Red"
                                size="lg"
                                iconPlacement='right'
                                Icon={Trash}
                                disabled={loading}
                                onClick={handleDeleteSupplier}
                            >
                                Delete supplier
                            </CustomButton>
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Saving Supplier...' : 'Save Changes'}
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}