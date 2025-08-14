'use client';

import { useEffect, useState } from 'react';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Navbar from "@/components/navbarForm";
import Dropdown from '@/components/ui/dropdown';
import "@/app/globals.css";

import {
  Plus,
  ChevronDown,
  Pencil,
  Search
} from 'lucide-react';
import { stat } from 'fs';

export default function addOutlet() {

    const [status, setStatus] = useState('');

    const statusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'Close', value: 'Close' },
  ];

    return (
        <div className="w-full self-stretch bg-white-2 flex flex-col justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <div className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Outlet Information</h1>
                        <p className="text-sm font-medium text-grey-desc">
                            Please fill in the information below to add a new outlet.
                        </p>
                </div>
                <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>

                <div className='flex flex-col w-full gap-4'>
                    <h2 className='text-sm font-semibold text-primary-orange uppercase'>About outlet</h2>
                <div className='inline-flex w-full gap-3'>
                    <CustomInput
                        type="text"
                        label="Outlet name"
                        placeholder="Your outlet name"
                        className="w-full"
                    />
                    <Dropdown
                        label="Outlet Status"
                        placeholder="Select one"
                        options={statusOptions}
                        value={status}
                        onChange={setStatus}
                        required
                    />   
                </div>
                <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                <h2 className='text-sm font-semibold text-primary-orange uppercase'>Outlet details</h2>
                <div className='inline-flex w-full gap-3'>
                    <CustomInput
                        type="text"
                        label="Country"
                        placeholder="Your outlet country"
                        className="w-full"
                    />
                    <CustomInput
                        type="text"
                        label="City"
                        placeholder="Your outlet city"
                        className="w-full"
                    />
                </div>
                <CustomInput
                        type="text"
                        label="Full address"
                        placeholder="Your full outlet address"
                        className="w-full"
                    />
                <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                
                <div className='flex justify-between items-center'>
                    <h2 className='text-sm font-semibold text-primary-orange uppercase'>Outlet accounts</h2>
                <CustomButton
                className='w-fit'
                    variant="primary"
                    size="sm"
                    Icon={Plus}
                >
                    Add account
                </CustomButton>
                </div>
                {/* Table */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start text-sm font-semibold uppercase items-center">
                                No.
                            </div>
                             <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Email
                            </div>
                            <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Account name
                            </div>
                            <div className="w-full self-stretch justify-start text-sm font-semibold uppercase">
                                Role
                            </div>
                        </div>
                </div>
                </div>
            </div>
        </div>
    );
}