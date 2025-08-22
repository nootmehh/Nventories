'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from '@/components/ui/customButton';
import { CustomInput } from '@/components/ui/input';
import CustomFileUpload from '@/components/ui/customFileUpload';
import FinishedGoodsModal from '@/components/modal/finishedGoodsModal';

import { useUser } from '@/context/UserContext';

export default function ShowStockOutPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [stockOutNumber, setStockOutNumber] = useState('');
    const [transactionDate, setTransactionDate] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [items, setItems] = useState<any[]>([]);

    const fetchShow = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/outlets/MS/stock-out/show/${id}`);
            const body = await res.json();
            if (!res.ok) { alert(body.message || 'Failed to fetch'); router.back(); return; }
            const data = body.data;
            setStockOutNumber(data.stock_out_number || '');
            setTransactionDate(data.transaction_date || null);
            setImages(Array.isArray(data.images) ? data.images : []);
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (e) { console.error('fetch show error', e); alert('Connection error'); router.back(); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchShow(); }, [id]);

    const formatRupiah = (v: number) => new Intl.NumberFormat('id-ID').format(Math.round(v || 0));

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col gap-8 justify-center items-center">
            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center gap-6 shadow-sm ">
                <div className="w-full flex flex-col gap-1">
                    <h1 className="font-semibold text-base text-primary-blue">Stock Out Details</h1>
                    <p className="text-sm font-medium text-grey-desc">View stock out details below</p>
                </div>

                <CustomInput label="Stock out no." value={stockOutNumber} intent="disabled" className="w-full" readOnly />

                <div className="self-stretch h-px bg-white-3"></div>

                <div className='inline-flex w-full justify-between items-center'>
                    <p className='font-medium text-sm text-grey-desc'>Product Details</p>
                </div>

                <div className='flex flex-col gap-0'>
                    <div className="bg-white-2 px-3 py-3 self-stretch w-full outline-1 outline-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
                        <div className="min-w-10">No.</div>
                        <div className="w-full">Finished Goods</div>
                        <div className="w-full">Amount Out</div>
                        <div className='w-full'>Unit</div>
                        <div className="w-full">Cost per unit (Rp)</div>
                        <div className="w-full">Total (Rp)</div>
                    </div>

                    {loading ? (
                        <div className="w-full text-center py-8 text-grey-desc font-medium">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="w-full text-center py-8 text-grey-desc font-medium">No items</div>
                    ) : (
                        items.map((p, index) => (
                            <div key={p.stock_out_id} className="px-3 py-3 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium">
                                <div className="min-w-10">{index + 1}.</div>
                                <div className="w-full">{p.product_name}</div>
                                <div className="w-full">{p.quantity_out}</div>
                                <div className="w-full">{p.unit_name}</div>
                                <div className="w-full">{formatRupiah(Number(p.price_per_unit || 0))}</div>
                                <div className='w-full'>{formatRupiah((Number(p.quantity_out) || 0) * Number(p.price_per_unit || 0))}</div>
                            </div>
                        ))
                    )}
                </div>

                {images.length > 0 ? (
                    <div className='mt-4'>
                        <p className='font-medium text-sm text-grey-desc'>Stock out images</p>
                        <div className='flex gap-3 mt-2'>
                            {images.map((src: string, i: number) => (
                                <img key={i} src={src} className='w-40 h-40 object-cover rounded-md' alt={`img-${i}`} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className='mt-4 text-grey-desc font-medium'>No images</div>
                )}

                <div className='mt-6 flex justify-end'>
                    <CustomButton className='mt-3' type='button' variant="outline" size="lg" onClick={() => router.back()}>Go back</CustomButton>
                </div>

            </div>
        </div>
    );
}