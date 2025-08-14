'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import BusinessProfileModal from '@/components/modal/businessProfileModal';
import { useRouter } from 'next/navigation';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Logika redirect di sini tidak lagi diperlukan karena sudah ditangani di login/page.tsx
  }, []);

  // --- LOGIKA KONDISIONAL MODAL DI SINI ---
  // Modal hanya muncul jika:
  // 1. Pengguna ada
  // 2. Peran pengguna adalah 'Owner'
  // 3. Pengguna belum melengkapi profil bisnis
  // 4. Komponen sudah di-mount
  const showBusinessModal = user && user.role === 'Owner' && !user.has_completed_profile && isMounted;

  return (
    <>
      {children}
      {showBusinessModal && <BusinessProfileModal />}
    </>
  );
}