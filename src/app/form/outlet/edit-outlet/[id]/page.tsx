'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';
import AddAccountModal from '@/components/modal/addAccountModal';
import { Plus, Trash, Pencil } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import "@/app/globals.css";

export default function EditOutletPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const outletId = params.id as string;

    const [outletName, setOutletName] = useState('');
    const [outletStatus, setOutletStatus] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [managerAccount, setManagerAccount] = useState<any | null>(null);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    
    const statusOptions = [
        { label: 'Open', value: 'Open' },
        { label: 'Close', value: 'Close' },
    ];

      const handleDeleteOutlet = async () => {
        if (!window.confirm('Are you sure you want to delete this outlet?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/outlets/delete/${outletId}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Outlet deleted successfully!');
                router.push('/outlet');
            } else {
                alert(data.message || 'Failed to delete outlet.');
            }
        } catch (error) {
            console.error('Failed to delete outlet:', error);
            alert('Connection error. Failed to delete outlet.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchOutletData = async () => {
            if (!outletId || !user?.business?.id) {
                setInitialLoading(false);
                router.push('/login');
                return;
            }

            try {
                const [outletResponse, accountsResponse] = await Promise.all([
                    fetch(`/api/outlets/get/${outletId}`),
                    fetch(`/api/outlets/accounts/${outletId}`)
                ]);
                
                if (outletResponse.ok && accountsResponse.ok) {
                    const [outletResult, accountsResult] = await Promise.all([
                        outletResponse.json(),
                        accountsResponse.json()
                    ]);
                    const outletData = outletResult.data;
                    setOutletName(outletData.outlet_name);
                    setOutletStatus(outletData.status);
                    setCountry(outletData.country);
                    setCity(outletData.city);
                    setFullAddress(outletData.address);

                    const fetchedAccounts = accountsResult.data;
                    setAccounts(fetchedAccounts);
                    
                    const manager = fetchedAccounts.find((acc: any) => acc.role === 'Manager');
                    if (manager) {
                      setManagerAccount(manager);
                    }
                } else {
                    alert('Failed to fetch outlet data.');
                    router.push('/outlet');
                }
            } catch (error) {
                console.error('Failed to fetch outlet:', error);
                alert('Connection error. Failed to fetch outlet.');
                router.push('/outlet');
            } finally {
                setInitialLoading(false);
            }
        };
        if (user) {
          fetchOutletData();
        } else {
          router.push('/');
        }
    }, [outletId, router, user]);

    const handleDeleteAccount = (id: number) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            setAccounts(prev => prev.filter(account => account.id !== id));
            if (managerAccount?.id === id) {
              setManagerAccount(null);
            }
        }
    };
    
    const handleSaveAccount = async (accountData: any): Promise<void> => {
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
    
    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!outletName || !outletStatus || !country || !city || !fullAddress || accounts.length === 0) {
                alert('Please fill in all fields and add at least one manager account.');
                setLoading(false);
                return;
            }
            if (!managerAccount) {
              alert('Please assign a manager account before saving.');
              setLoading(false);
              return;
            }
            
            const payload = {
                outletName,
                outletStatus,
                country,
                city,
                fullAddress,
                managerId: managerAccount.id,
                accounts,
            };

            const response = await fetch(`/api/outlets/update/${outletId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Outlet updated successfully!');
                router.push('/outlet');
            } else {
                alert(data.message || 'Failed to update outlet.');
            }
        } catch (error) {
            console.error('Failed to update outlet:', error);
            alert('Connection error. Failed to update outlet.');
        } finally {
            setLoading(false);
        }
    };
    
    if (initialLoading) {
        return <div>Loading outlet data...</div>;
    }

    return (
        <div className="w-full self-stretch pt-16 pb-8 bg-white-2 flex flex-col justify-center items-center">
            
            {showAddAccountModal && (
                <AddAccountModal 
                    isOpen={showAddAccountModal}
                    onClose={() => setShowAddAccountModal(false)}
                    onSave={handleSaveAccount}
                />
            )}

            <div className="w-6xl px-8 py-6 bg-white-1 rounded-2xl flex flex-col justify-center shadow-sm ">
                <form onSubmit={handleSubmitUpdate} className="w-full flex flex-col gap-6">
                    <div className="w-full flex flex-col gap-1">
                        <h1 className="font-semibold text-base text-primary-blue">Outlet Information</h1>
                        <p className="text-sm font-medium text-grey-desc">Please fill in the information below to edit outlet.</p>
                    </div>
                    <div className="self-stretch h-px border-t border-white-3"></div>

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

                    <div className="self-stretch h-px border-t border-white-3"></div>
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
                    <div className="self-stretch h-px border-t border-white-3"></div>
                    
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
                    
                    <div className='flex flex-col w-full'>
                        <div className="bg-white-2 px-3 py-4 self-stretch w-full outline-1 outline-white-3 inline-flex items-center justif-start gap-6 text-grey-desc">
                            <div className="min-w-6 justify-start text-sm font-semibold uppercase items-center">No.</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Email</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Account name</div>
                            <div className="w-full justify-start text-sm font-semibold uppercase">Role</div>
                            <div className='flex justify-end'>
                                <CustomButton className='collapse' variant="ghost" size="smallIcon" Icon={Trash} />
                            </div>
                        </div>
                        {accounts.length > 0 ? (
                            accounts.map((account, index) => (
                                <div key={account.id} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center gap-6 text-grey-2">
                                    <div className="min-w-6 text-sm font-medium">{index + 1}.</div>
                                    <div className="w-full text-sm font-medium">{account.email}</div>
                                    <div className="w-full text-sm font-medium">{account.username}</div>
                                    <div className="w-full text-sm font-medium">{account.role}</div>
                                    <div className="flex justify-end gap-1">
                                        <CustomButton variant="Red" size="smallIcon" Icon={Trash} onClick={() => handleDeleteAccount(account.id)} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-8 text-grey-desc">No accounts added yet.</div>
                        )}
                    </div>       
                    <div className="flex justify-end mt-8 gap-3">
                        {user?.role === 'Owner' && user?.business?.mainOutlet?.id !== Number(outletId) && (
                        <CustomButton
                            type="button"
                            variant="Red"
                            size="lg"
                            disabled={loading}
                            iconPlacement='right'
                            Icon={Trash}
                            onClick={handleDeleteOutlet}
                        >
                            Delete Outlet
                        </CustomButton>
                    )}
                        <CustomButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Updating Outlet...' : 'Save Changes'}
                        </CustomButton>
                    </div>
                </form>
            </div>
        </div>
    );
}