'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react'; // Ikon panah
import { cn } from '@/libs/utils'; // Untuk menggabungkan class

// Definisikan tipe untuk setiap opsi dropdown
interface DropdownOption {
  label: string; // Teks yang akan ditampilkan
  value: string; // Nilai yang akan dikembalikan saat dipilih
}

// Definisikan props untuk komponen Dropdown
interface DropdownProps {
  label?: string; // Label di atas dropdown (opsional)
  placeholder?: string; // Teks placeholder saat belum ada pilihan
  value: string; // Nilai yang terpilih saat ini (untuk controlled component)
  onChange: (value: string) => void; // Callback saat nilai berubah
  options: DropdownOption[]; // Array opsi dropdown
  className?: string; // Class tambahan untuk styling wrapper
  disabled?: boolean; // Untuk menonaktifkan dropdown
  required?: boolean; // Untuk validasi form
}

export default function Dropdown({
  label,
  placeholder = 'Select an option',
  value,
  onChange,
  options,
  className,
  disabled,
  required,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fungsi untuk menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Cari label dari nilai yang terpilih
  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={cn('w-full relative', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-grey-desc mb-1">
          {label}
        </label>
      )}
      <button
        type="button" // Penting: agar tidak submit form saat di klik
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex justify-between items-center w-full px-3 py-2 border border-grey-1 bg-white rounded-md shadow-sm cursor-pointer',
          'focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm',
          disabled ? 'bg-white-3 text-grey-desc cursor-not-allowed' : 'text-primary-orange bg-white-2 font-medium',
          value === '' && 'text-gray-400' // Placeholder styling
        )}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOptionLabel}</span>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 mt-2 w-full bg-white shadow-sm max-h-60 rounded-md py-1 text-sm ring-1 ring-grey-1 ring-opacity-5 overflow-auto focus:outline-none"
        >
          {required && value === '' && ( // Opsi placeholder hanya jika required dan belum ada value
            <li
              className="text-primary-orange relative cursor-default select-none py-2 pl-3 pr-9"
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </li>
          )}
          {options.map((option) => (
            <li
              key={option.value}
              className={cn(
                'relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-white-3 hover:text-primary-orange',
                option.value === value ? 'bg-white-2 text-primary-orange' : 'text-grey-desc'
              )}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
      {required && value === '' && ( // Validasi visual sederhana untuk required
        <input type="hidden" required={required} value={value} />
      )}
    </div>
  );
}