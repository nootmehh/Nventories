'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CustomInput } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/customButton';
import PasswordInput from '@/components/passwordinput';
import Dropdown from '@/components/ui/dropdown';

interface AddAccountModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (data: any) => Promise<void>; // Prop untuk callback saat form disimpan
}

export default function AddAccountModal({ isOpen, onCloseAction, onSaveAction }: AddAccountModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Opsi untuk dropdown Role
  const roleOptions = [
    { label: 'Manager', value: 'Manager' },
    { label: 'Employee', value: 'Employee' },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !email || !role || !password) {
      alert('Mohon isi semua field.');
      setLoading(false);
      return;
    }

    try {
  // Panggil prop onSaveAction dari parent component
  await onSaveAction({ username, email, role, password });
      
      // Reset form setelah berhasil
      setUsername('');
      setEmail('');
      setRole('');
      setPassword('');
  onCloseAction(); // Tutup modal
    } catch (error) {
      // Error akan ditangani di parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
        <div className='inline-flex justify-between gap-3 w-full'>
            <div className="flex flex-col justify-start mb-8 gap-1 w-full">
          <h2 className="text-xl font-semibold text-primary-blue">Add Account</h2>
          <p className="text-sm font-medium text-grey-desc">
            Please fill out the information to continue.
          </p>
        </div>
  <CustomButton variant="ghost" size="smallIcon" onClick={onCloseAction} Icon={X} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
            className='w-full'
              label="Username"
              placeholder="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Dropdown
              label="Role"
              placeholder="Choose one"
              options={roleOptions}
              value={role}
              onChange={setRole}
              required
            />
          </div>
          <CustomInput
          className='w-full'
            label="Email"
            placeholder="Ex: email@you.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Ex: yourpassword123"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-6">
            <CustomButton type="button" variant="ghost" onClick={onCloseAction}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Account'}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}