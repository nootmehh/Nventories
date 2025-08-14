'use client'; // Pastikan ini ada di paling atas

import Image from "next/image";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext'; // Pastikan path ke useUser benar

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import PasswordInput from "@/components/passwordinput";
import "@/app/globals.css"; // Tidak perlu diimport di sini, sudah di RootLayout

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { loginUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API Response Data:', data);

      if (response.ok) {
        alert(data.message);
        loginUser(data.user);
        
        // --- LOGIKA REDIRECT BERDASARKAN ROLE ---
        const { role, outletId } = data.user;
        
        if (role === 'Owner') {
            router.push('/outlet'); // Arahkan Owner ke halaman utama outlet
        } else if (role === 'Manager' && outletId) {
            router.push(`/outlet/report/${outletId}`); // Arahkan Manager ke halaman laporan outlet mereka
        } else if (role === 'Employee' && outletId) {
            router.push(`/outlet/SP/stock-in/${outletId}`); // Arahkan Employee ke halaman stok masuk
        } else {
            // Jika role tidak terdefinisi atau tidak ada outlet, arahkan ke halaman default
            router.push('/');
        }
        // --- AKHIR LOGIKA REDIRECT ---

      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white-2 p-4">
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-6xl">
        <div className="w-full md:w-96 flex flex-col justify-start items-center gap-6">
          <div className="w-full p-4 bg-white-1 rounded-2xl shadow-[0px_0.5px_4px_0px] flex flex-col items-center gap-6">
            <div className="w-full p-2.5 flex flex-col justify-center items-center gap-6">
              <Image className="w-40 h-12" src="/images/logo.png" alt="Logo Saleskuy!" width={160} height={48} />
              <div className="self-stretch flex flex-col justify-start items-center gap-3">
                <div className="self-stretch text-center text-primary-blue text-2xl font-bold">
                  Login Dashboard
                </div>
                <div className="w-full space-y-4 flex flex-col justify-start items-start">
                  <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <CustomInput
                      type="email"
                      label="Email"
                      placeholder="your@email.com"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <PasswordInput
                      label="Password"
                      placeholder="Please enter your password!"
                      value={password}
                      // Pastikan ini onValueChange jika itu yang digunakan PasswordInput Anda
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                    />
                    <CustomButton
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </CustomButton>
                  </form>
                  <div className="w-full inline-flex justify-center items-center gap-2">
                    <p className="text-sm text-grey-desc">Doesn't have an account?</p>
                    <Link href="/signup" className="text-sm text-primary-orange font-medium hover:underline">
                      Sign up here!
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="justify-start flex-col gap-6 hidden md:flex">
          <Image src="/images/login_illustration.png" alt="Login Illustration" width={400} height={400} />
          <div className="justify-start flex flex-col gap-3">
            <div className="text-primary-blue text-2xl font-bold">
              Ease your inventory management with Sales<span className="text-primary-orange">kuy!</span>
            </div>
            <p className="text-sm font-medium text-grey-desc">Get accurate sales reports to maximize your business profits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}