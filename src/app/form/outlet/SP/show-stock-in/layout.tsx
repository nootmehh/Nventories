'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import NavbarForm from '@/components/navbarForm';

export default function ShowStockInLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  const { user } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!user && isMounted) {
      router.push('/'); // Redirect ke login jika tidak terautentikasi
    }
  }, [user, router, isMounted]);

  if (!user || !isMounted) {
    return <div>Loading...</div>; // Tampilkan loading sebelum render
  }

  return (
    // Wrapper utama: flex-col untuk menyusun elemen secara vertikal
    <div className="flex flex-col min-h-screen bg-white-2">
      <NavbarForm title="Show Stock In" /> 
      <main className="mt-8 flex-grow">
        {children}
      </main>
    </div>
  );
}