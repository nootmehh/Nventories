'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import "@/app/globals.css";

import { useUser } from '@/context/UserContext';


export default function AddSupplierPage() {
     const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [supplierCode, setSupplierCode] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmitSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!user || !outletId) {
            alert('User or outlet data is missing. Please log in again.');
            setLoading(false);
            return;
        }

        if (!supplierName || !supplierCode || !address) {
            alert('Please fill in all required fields.');
            setLoading(false);
            return;
        }
        
        try {
            const response = await fetch('/api/outlets/suppliers/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    outletId,
                    supplierName,
                    supplierCode,
                    phoneNumber,
                    email,
                    address,
                    province,
                    city,
                    description,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Supplier added successfully!');
                router.push(`/outlet/supplier-list/${outletId}`);
            } else {
                alert(data.message || 'Failed to add supplier.');
            }
        } catch (error) {
            console.error('Failed to add supplier:', error);
            alert('Connection error. Failed to add supplier.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col justify-center items-center">

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form onSubmit={
                    handleSubmitSupplier
                } className="w-full flex flex-col gap-6">
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
                            placeholder="Suplier phone number"
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
                        <CustomInput
                            type="text"
                            label="Description"
                            placeholder="Description about the supplier"
                            className="w-full"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    

                    <div className="flex justify-end mt-8">
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Saving Outlet...' : 'Save Supplier'}
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}