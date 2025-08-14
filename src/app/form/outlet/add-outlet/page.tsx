'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';
import AddAccountModal from '@/components/modal/addAccountModal';
import "@/app/globals.css";

import {
Plus,
Trash,
} from 'lucide-react';
// Hapus import yang tidak diperlukan
// import { stat } from 'fs';
import { useUser } from '@/context/UserContext';


export default function AddOutletPage() {
    const { user } = useUser();
    const router = useRouter();

    // State untuk form utama outlet
    const [outletName, setOutletName] = useState('');
    const [outletStatus, setOutletStatus] = useState('Open');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [loading, setLoading] = useState(false);

    // State untuk data akun
    const [accounts, setAccounts] = useState<any[]>([]);
    const [managerAccount, setManagerAccount] = useState<any | null>(null);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);

    const statusOptions = [
        { label: 'Open', value: 'Open' },
        { label: 'Close', value: 'Close' },
    ];
    
    // Fungsi untuk menyimpan data outlet
    const handleSubmitOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (!outletName || !outletStatus || !country || !city || !fullAddress || accounts.length === 0) {
            alert('Please fill in all fields and add at least one account.');
            setLoading(false);
            return;
        }

        // --- VALIDASI TAMBAHAN ---
        if (!managerAccount) {
            alert('Please assign a manager account before saving.');
            setLoading(false);
            return;
        }
        // --- AKHIR VALIDASI ---

        const response = await fetch('/api/outlets/create-outlet-with-accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ownerId: user?.id,
                outletName,
                outletStatus,
                country,
                city,
                fullAddress,
                accounts,
                managerId: managerAccount.id, // Gunakan id dari managerAccount
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Outlet and accounts created successfully!');
            router.push('/outlet');
        } else {
            alert(data.message || 'Failed to save outlet.');
        }

    } catch (error) {
        console.error('Failed to save outlet:', error);
        alert('Connection error, please try again later.');
    } finally {
        setLoading(false);
    }
};


    // Fungsi untuk menyimpan data akun dari modal
    const handleSaveAccount = async (accountData: any) => {
        if (!user) {
            alert("Owner user data not found.");
            return;
        }
        try {
            const newAccount = { ...accountData, id: accounts.length + 1 };
            setAccounts(prev => [...prev, newAccount]);
            alert("Account added successfully!");

            if (newAccount.role === 'Manager') {
            setManagerAccount(newAccount);
        }
        } catch (error) {
            console.error('Failed to save account:', error);
            alert('Connection error. Failed to add account.');
            throw error;
        }
    };

    // --- FUNGSI BARU UNTUK MENGHAPUS AKUN ---
    const handleDeleteAccount = (id: number) => {
      if (window.confirm('Are you sure you want to delete this account?')) {
        setAccounts(prev => prev.filter(account => account.id !== id));
      }
    };

    return (
        <div className="w-full self-stretch pt-18 pb-8 bg-white-2 flex flex-col justify-center items-center">
            
            {showAddAccountModal && (
                <AddAccountModal 
                    isOpen={showAddAccountModal}
                    onClose={() => setShowAddAccountModal(false)}
                    onSave={handleSaveAccount}
                />
            )}

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form onSubmit={handleSubmitOutlet} className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Outlet Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to add a new outlet.</p>
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
                                value={outletName}
                                onChange={(e) => setOutletName(e.target.value)}
                                required
                            />
                            <Dropdown
                                label="Outlet Status"
                                placeholder="Select one"
                                options={statusOptions}
                                value={outletStatus}
                                onChange={setOutletStatus}
                                required
                            />   
                        </div>
                    </div>
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    <h2 className='text-sm font-semibold text-primary-orange uppercase'>Outlet details</h2>
                    <div className='inline-flex w-full gap-3'>
                        <CustomInput
                            type="text"
                            label="Country"
                            placeholder="Your outlet country"
                            className="w-full"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
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
                        label="Full address"
                        placeholder="Your full outlet address"
                        className="w-full"
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        required
                    />
                    <div className="self-stretch h-0 outline-[1.50px] outline-offset-[-0.75px] outline-white-3"></div>
                    
                    <div className='flex justify-between items-center'>
                        <h2 className='text-sm font-semibold text-primary-orange uppercase'>Outlet accounts</h2>
                        <CustomButton
                            type="button"
                            className='w-fit'
                            variant="primary"
                            size="sm"
                            Icon={Plus}
                            onClick={() => setShowAddAccountModal(true)}
                        >
                            Add account
                        </CustomButton>
                    </div>
                    
                    <div className='flex flex-col w-full gap-0'>
                        {/* Table */}
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start text-sm font-semibold uppercase items-center">No.</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Email</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Account name</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Role</div>
                            <div className='collapse'>
                                <CustomButton variant="ghost" size="smallIcon" Icon={Trash} />
                            </div>
                        </div>
                        {/* Inside Table */}
                        {accounts.length > 0 ? (
                            accounts.map((account, index) => (
                                <div key={account.id} className="px-3 py-4 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2">
                                    <div className="min-w-6 justify-start text-sm font-medium items-center">{index + 1}.</div>
                                    <div className="w-full justify-start text-sm font-medium items-center">{account.email}</div>
                                    <div className="w-full justify-start text-sm font-medium items-center">{account.username}</div>
                                    <div className="w-full justify-start text-sm font-medium">{account.role}</div>
                                    <div>
                                        <CustomButton
                                            variant="Red"
                                            size="smallIcon"
                                            Icon={Trash}
                                            onClick={() => handleDeleteAccount(account.id)}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center text-sm py-8 font-medium text-grey-desc">No accounts added yet.</div>
                        )}
                    </div>

                    <div className="flex justify-end mt-8">
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Saving Outlet...' : 'Save Outlet'}
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}