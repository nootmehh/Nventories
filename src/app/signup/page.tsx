'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import PasswordInput from "@/components/passwordinput";
import "@/app/globals.css";


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      alert('Password does not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        router.push('/');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Connection error, please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white-2">
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-6xl p-4">
        <div className="w-96 flex flex-col justify-start items-center gap-6">
          <div className="w-full p-4 bg-white-1 rounded-2xl shadow-[0px_0.5px_4px_0px] flex flex-col items-center gap-6">
            <div className="w-full p-2.5 flex flex-col justify-center items-center gap-6">
              <Image className="w-40 h-12" src="/images/logo.png" alt="Logo Saleskuy!" width={160} height={48} />
              <div className="self-stretch flex flex-col justify-start items-center gap-3">
                <div className="self-stretch text-center text-primary-blue text-2xl font-bold">
                  Sign up time!
                </div>
                <div className="w-full flex flex-col justify-start items-start gap-3">
                  <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <CustomInput 
                      type="text" 
                      label="Name" 
                      placeholder="Your name" 
                      className="w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <CustomInput 
                      type="email" 
                      label="Email" 
                      placeholder="Your email" 
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <PasswordInput 
                      label="Password"
                      placeholder="Your password here"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <PasswordInput 
                      label="Confirm password"
                      placeholder="Please confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <CustomButton 
                      type="submit"
                      variant="primary" 
                      size="md" 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? 'Signing up...' : 'Sign up'}
                    </CustomButton>
                  </form>
                  <div className="w-full inline-flex justify-center items-center gap-2">
                    <p className="text-sm text-grey-desc">Already have an account?</p>
                    <Link href="/" className="text-sm text-primary-orange font-medium hover:underline">
                      Login here!
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