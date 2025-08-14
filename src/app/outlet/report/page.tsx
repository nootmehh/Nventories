'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import Dropdown from '@/components/ui/dropdown';
import AddAccountModal from '@/components/modal/addAccountModal';
import "@/app/globals.css";

import {
Plus,
Trash,
} from 'lucide-react';
// Hapus import yang tidak diperlukan
// import { stat } from 'fs';
import { useUser } from '@/context/UserContext';


export default function AddOutletPage() {

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            Hello
            </div>
    );
}