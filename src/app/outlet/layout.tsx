'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Navbar from '../../components/navbar';
import Sidebar from '../../components/sidebar';

export default function OutletLayout({
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
      router.push('/');
    }
  }, [user, router, isMounted]);

  if (!user || !isMounted) {
    return <div>Loading...</div>;
  }

  return (
    /* Vertical Layout*/
    <div className="flex flex-col min-h-screen bg-white-2">
      <Navbar />     
     {/* Horizontal Layout*/}
      <div className="flex flex-1">
        <Sidebar />
        <main className='mt-18 ml-64 p-6 flex-grow'>
          {children}
        </main>
      </div>
    </div>
  );
}