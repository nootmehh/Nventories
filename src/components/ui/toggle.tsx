'use client';

import React, { useState } from 'react';
import { cn } from '@/libs/utils';

interface ToggleProps {
  // Apakah toggle sedang dalam keadaan "on" atau "off"
  isOn: boolean;
  // Fungsi yang dipanggil saat toggle diubah
  onToggle: (isOn: boolean) => void;
  // Kelas CSS tambahan untuk styling
  className?: string;
}

export default function Toggle({ isOn, onToggle, className }: ToggleProps) {
  const handleClick = () => {
    onToggle(!isOn);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2',
        isOn ? 'bg-primary-orange' : 'bg-grey-2',
        className
      )}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          isOn ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}