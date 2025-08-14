'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react'; // Import ikon 'X'
import { CustomButton } from './ui/customButton'; // Pastikan path benar

interface NavbarFormProps {
  title: string; // Properti untuk judul (misal: "Tambah Daftar Outlet")
}

export default function NavbarForm({ title }: NavbarFormProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <nav className="z-30 fixed w-full px-8 py-3 bg-white-1 shadow-[0px_0.5px_2px_0px_rgba(0,0,0,0.15)] flex items-center justify-center h-18">
      <div className="absolute left-8 flex items-center gap-3">
        <CustomButton
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          Icon={X}
        />
        <span className="text-primary-blue text-lg font-semibold">{title}</span>
      </div>
      <div className="flex justify-center flex-grow">
        <Image src="/images/logo.png" alt="Saleskuy Logo" width={112} height={34} />
      </div>
      <div className="absolute right-8">
      </div>
    </nav>
  );
}