'use client';

import React from 'react';
import { CustomButton } from '@/components/ui/customButton'; // Pastikan path ini benar
import { Search } from 'lucide-react'; // Ikon default, bisa diubah jika perlu
import { cn } from '@/libs/utils'; // Untuk menggabungkan class

// Definisikan props untuk komponen EmptyStateTable
interface EmptyStateTableProps {
  title: string;
  orangeDesc: string;
  description: string | React.ReactNode;
  icon?: React.ElementType;
  buttonVariant?: "disabled" | "primary" | "outline" | "ghost" | "Red";
  buttonSize?: "sm" | "md" | "lg" | "icon";
  className?: string; 
}

export default function EmptyStateTable({
  title,
  description,
  orangeDesc,
  icon: IconComponent = Search, // Default icon jika tidak diberikan
  buttonVariant = "disabled", // Default variant tombol
  buttonSize = "icon", // Default size tombol
  className,
}: EmptyStateTableProps) {
  return (
    <div className={cn(
        "self-stretch h-[500px] bg-white-1 inline-flex flex-col justify-center items-center",
        className
    )}>
      <div className="w-64 flex flex-col items-center justify-center gap-4">
        <CustomButton
          variant={buttonVariant}
          size={buttonSize}
          Icon={IconComponent}
        />

        <div className="w-full flex flex-col items-center justify-center gap-1">
          <h3 className="font-semibold text-base text-primary-blue">
            {title}
          </h3>
          <p className="font-medium text-sm text-grey-desc text-center">
            <span className="text-primary-orange font-semibold mr-1">{orangeDesc}</span>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}