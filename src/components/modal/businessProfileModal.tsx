'use client';

import React, { useState } from 'react';
import { CustomInput } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/customButton';
import { useUser } from '@/context/UserContext';
import Dropdown from '../ui/dropdown';

import { ChevronDown } from 'lucide-react';

export default function BusinessProfileModal() {
  const { user, loginUser } = useUser();
  const [businessName, setBusinessName] = useState('');
  const [businessSector, setBusinessSector] = useState('');
  const [outletName, setOutletName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const businessSectorOptions = [
    { label: 'Food & Beverage', value: 'Food & Beverage' },
    { label: 'Retail', value: 'Retail' },
    { label: 'Service', value: 'Service' },
    { label: 'Technology', value: 'Technology' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !user.id) {
      alert('User data not found. Please log in again.');
      setLoading(false);
      return;
    }

    if (!businessName || !businessSector || !outletName || !country || !city || !address) {
      alert('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Panggil API baru untuk membuat bisnis dan outlet
      const response = await fetch('/api/business/create-with-outlet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          businessName,
          businessSector,
          outletName,
          country,
          city,
          address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        // PENTING: Panggil loginUser dengan objek user LENGKAP dari respons API
        loginUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to save business profile:', error);
      alert('Failed to save business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex flex-col items-center mb-6 gap-1">
          <h2 className="text-2xl font-bold text-center text-primary-blue">
            What is your business?
          </h2>
          <p className="text-center text-sm font-medium text-grey-desc">
            Please fill out your business profile to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-grey-2 uppercase">Business Information</h3>
            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Business Owner"
              className='w-full'
              intent={'disabled'}
              type="text"
              value={user?.name || 'Registered user'}
              disabled
            />
            <CustomInput
              label="Business Name"
              className='w-full'
              placeholder="Your Business Name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>
          
          <Dropdown
            label="Business Sector"
            placeholder="Select one"
            options={businessSectorOptions}
            value={businessSector}
            onChange={setBusinessSector}
            required
          />

          <div className="flex flex-col gap-1 mt-4">
            <h3 className="text-sm font-semibold text-grey-2 uppercase">Main Outlet Information</h3>
            <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
          </div>

          <CustomInput
            label="Main Outlet Name"
            className='w-full'
            placeholder="Your main outlet name"
            type="text"
            value={outletName}
            onChange={(e) => setOutletName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Country"
              className='w-full'
              placeholder="Your main outlet country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
            <CustomInput
              label="City"
              className='w-full'
              placeholder="Your main outlet city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <CustomInput
            label="Full Address"
            className='w-full'
            placeholder="Your full outlet address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <CustomButton
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save business profile'}
          </CustomButton>
        </form>
      </div>
    </div>
  );
}