'use client';

import Link from "next/link";
import Image from "next/image";
import { CustomButton } from "./ui/customButton";
import { Bell, LogOut, CircleUserRound } from "lucide-react";
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, logoutUser } = useUser();
    const router = useRouter();

    const handleLogout = () => {
        logoutUser();
        alert('Account logged out');
        router.push('/');
    };

    return (
        <nav className ="fixed top-0 left-0 w-full h-18 px-8 py-3 bg-white-1 shadow-[0px_0.5px_2px_0px_rgba(0,0,0,0.15)] justify-between items-center flex z-10">
            <Link href="/outlet">
                <Image
                src="/images/logo.png"
                alt="Saleskuy Logo"
                width={112}
                height={34}
                />
            </Link>
            
            <div className="flex items-center gap-3">
                <CustomButton
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                    Icon={Bell}
                />
                <div className="flex flex-col justify-end items-end gap-0">
                    <div className="font-semibold text-base text-primary-blue">
                        {user?.name || 'Guest'}
                    </div>
                    <div className="font-medium text-sm text-grey-desc">
                        {user?.role || 'User Role'}
                    </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white-3 border-[1.5px] border-grey-2 overflow-hidden flex justify-center items-center">
                    <CircleUserRound className="w-6 h-6 text-grey-2" />
                </div>
                
                {user && (
                    <CustomButton
                        variant="Red"
                        size="icon"
                        className="hidden md:flex"
                        Icon={LogOut}
                        onClick={handleLogout}
                    />
                )}
            </div>
        </nav>
    )
}