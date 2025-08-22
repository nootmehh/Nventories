'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import "@/app/globals.css";
import { useUser } from '@/context/UserContext';
import { CircleAlert, Clock, Package, Sparkle } from 'lucide-react';
import { CustomButton } from '@/components/ui/customButton';

export default function ReportPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;
    const ctx = useUser();
    const user = ctx?.user;
    const selectedOutlet = ctx?.allOutlets?.find((o: any) => o.id === ctx?.selectedOutletId);

    const hasActiveFilter = false; // placeholder for future filters

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl inline-flex flex-col justify-between items-start shadow-sm gap-6">
                <div className="flex justify-between items-center w-full">
                    <div className="justify-start flex flex-col gap-1">
                        <h1 className="font-semibold text-lg text-primary-blue">
                            Report <span className="text-grey-desc font-medium">| {selectedOutlet?.outlet_name || user?.business?.businessName || 'Business Name'}</span>
                        </h1>
                        <p className="text-sm font-medium text-grey-desc">
                            Analytics & Reports for your business
                        </p>
                    </div>
                </div>
                <div className='w-full inline-flex gap-3'>
                    <div className='w-full bg-white-1 rounded-md border-2 border-white-3 p-3 hover:bg-white-2'>
                        <div className='inline-flex justify-between w-full'>
                            <p className='font-medium text-sm text-grey-desc'>
                            Raw materials
                        </p>
                        <Package className='w-5 h-5 text-grey-desc' />
                        </div>
                        <div className='flex flex-col gap-0 mt-5'>
                            <p className='font-semibold text-xl text-primary-blue'>
                                100
                            </p>
                            <p className='font-medium text-xs text-grey-desc'>
                                <span className='text-primary-orange'>+10%</span> from last month
                            </p>
                        </div>
                    </div>
                    <div className='w-full bg-white-1 rounded-md border-2 border-white-3 p-3 hover:bg-white-2'>
                        <div className='inline-flex justify-between w-full'>
                            <p className='font-medium text-sm text-grey-desc'>
                            Finished goods
                        </p>
                        <Sparkle className='w-5 h-5 text-grey-desc' />
                        </div>
                        <div className='flex flex-col gap-0 mt-5'>
                            <p className='font-semibold text-xl text-primary-blue'>
                                100
                            </p>
                            <p className='font-medium text-xs text-grey-desc'>
                                <span className='text-primary-orange'>+10%</span> from last month
                            </p>
                        </div>
                    </div>
                    <div className='w-full bg-white-1 rounded-md border-2 border-white-3 p-3 hover:bg-white-2'>
                        <div className='inline-flex justify-between w-full'>
                            <p className='font-medium text-sm text-grey-desc'>
                            Low stock items
                        </p>
                        <CircleAlert className='w-5 h-5 text-state-red' />
                        </div>
                        <div className='flex flex-col gap-0 mt-5'>
                            <p className='font-semibold text-xl text-primary-blue'>
                                100
                            </p>
                            <p className='font-medium text-xs text-grey-desc'>
                                <span className='text-primary-orange'>+10%</span> from last month
                            </p>
                        </div>
                    </div>
                </div>

                <div className='w-full inline-flex gap-3'>
                    <div className='w-full bg-white-1 rounded-md border-2 border-white-3 p-3 hover:bg-white-2 items-center flex flex-col gap-3'>
                        <div className='inline-flex justify-between w-full'>
                            <p className='font-semibold text-sm text-primary-blue'>Recent Activity</p>
                        </div>

                        {/* Make this at least show 5 newest */}
                        <div className='w-full inline-flex bg-white-2 rounded-md p-3 border-1 items-center justify-between'>
                            <div className='flex flex-col gap-1'>
                                <p className='font-medium text-sm text-grey-desc'>Feature A (Ex: Stock In)</p>
                                <p className='font-medium text-xs mt-1 text-primary-orange'>Ex: Product A <span className='text-grey-desc'>Qty: 10</span></p>
                            </div>
                            <div className='font-medium text-sm text-grey-desc rounded-md inline-flex gap-1 items-center'><Clock className='w-4 h-4 text-grey-desc'/>2 Hours ago</div>
                        </div>
                    </div>

                    <div className='w-full bg-white-1 rounded-md border-2 border-white-3 p-3 hover:bg-white-2 items-center'>
                        <div className='inline-flex justify-start w-full gap-2'>
                            <CircleAlert className='w-5 h-5 text-state-red' />
                            <p className='font-semibold text-sm text-state-red'>Low stock alert</p>
                        </div>

                        
                    </div>

                </div>
            </div>
        </div>
    );
}