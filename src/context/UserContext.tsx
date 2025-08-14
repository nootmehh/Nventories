'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';

// Tipe Outlet dari API /outlets/list
interface Outlet {
  id: number | null;
  outlet_name: string | null; // DIUBAH: dari 'name' menjadi 'outlet_name'
  address: string | null; // Tambahkan address agar konsisten
  city: string | null;
  status: 'Open' | 'Close' | null;
  manager_name: string | null; // Tambahkan manager_name
}

// Tipe Main Outlet dari API login
interface MainOutlet {
  id: number | null;
  name: string | null; // Ini tetap 'name' karena aliasnya berbeda di API login
  city: string | null;
  country: string | null;
}

// Tipe Business
interface Business {
  id: number | null;
  businessName: string | null;
  mainOutlet: MainOutlet; // Menggunakan tipe MainOutlet yang baru
  businessSector: string | null;
}

// Tipe User
interface User {
  id: number;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Employee';
  has_completed_profile: boolean;
  business: Business | null;
}

// Tipe konteks
interface UserContextType {
  user: User | null;
  allOutlets: Outlet[] | null;
  selectedOutletId: number | null;
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  setSelectedOutletId: (id: number | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (Cookies.get('session_token') && storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }
    }
    return null;
  });

  const [allOutlets, setAllOutlets] = useState<Outlet[] | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAllOutlets = async () => {
      if (!user?.business?.id) return;

      try {
        const response = await fetch(`/api/outlets/list?businessId=${user.business.id}`);
        const result = await response.json();

        if (response.ok && Array.isArray(result.data)) {
          setAllOutlets(result.data);
          setSelectedOutletId(user.business.mainOutlet?.id ?? null);
        } else {
          console.error('Failed to fetch outlets:', result.message || 'Unknown error');
          setAllOutlets([]);
        }
      } catch (error) {
        console.error('Network error while fetching outlets:', error);
        setAllOutlets([]);
      }
    };

    fetchAllOutlets();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        Cookies.set('session_token', 'true', { expires: 7 });
      } else {
        localStorage.removeItem('user');
        Cookies.remove('session_token');
      }
    }
  }, [user]);

  const loginUser = (userData: User) => {
    setUser(userData);
  };

  const logoutUser = () => {
    setUser(null);
    setAllOutlets(null);
    setSelectedOutletId(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        allOutlets,
        selectedOutletId,
        setSelectedOutletId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}