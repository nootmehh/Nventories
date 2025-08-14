'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Dropdown from '@/components/ui/dropdown'; // Menggunakan komponen Dropdown yang sudah kita buat
import { cn } from '@/libs/utils'; // Untuk menggabungkan class

// Definisikan props untuk komponen Pagination
interface PaginationProps {
  totalItems: number; // Total item data yang tersedia
  itemsPerPage: number; // Jumlah item yang ditampilkan per halaman
  currentPage: number; // Halaman yang sedang aktif saat ini
  onPageChange: (page: number) => void; // Callback saat halaman berubah
  onItemsPerPageChange: (items: number) => void; // Callback saat jumlah item per halaman berubah
  pageRangeDisplayed?: number; // Jumlah angka halaman yang ditampilkan (misal: 1, 2, 3)
}

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  pageRangeDisplayed = 3, // Default 3 angka halaman
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Opsi untuk dropdown "Tampilkan:"
  const itemsPerPageOptions = [
    { label: '10', value: '10' },
    { label: '25', value: '25' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
  ];

  // Hitung rentang item yang ditampilkan
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Fungsi untuk menghasilkan angka halaman yang akan ditampilkan
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= pageRangeDisplayed) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(pageRangeDisplayed / 2));
      let endPage = Math.min(totalPages, startPage + pageRangeDisplayed - 1);

      if (endPage - startPage + 1 < pageRangeDisplayed) {
        startPage = Math.max(1, endPage - pageRangeDisplayed + 1);
      }

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-between items-center px-4 py-3 bg-white-1 rounded-b-lg shadow-sm text-sm font-medium text-grey-desc">
      {/* Bagian Kiri: Tampilkan Jumlah Data */}
      <div className="flex items-center gap-2">
        <span>Tampilkan:</span>
        <div className="w-20"> {/* Atur lebar dropdown */}
          <Dropdown
            placeholder="" // Tidak perlu placeholder di sini
            options={itemsPerPageOptions}
            value={String(itemsPerPage)} // Pastikan value adalah string
            onChange={(value) => onItemsPerPageChange(Number(value))}
            className="!space-y-0" // Hapus space-y default dari Dropdown
          />
        </div>
        <span>
          Ditampilkan {startItem} - {endItem} dari {totalItems} data
        </span>
      </div>

      {/* Bagian Kanan: Navigasi Halaman */}
      <div className="flex items-center gap-2">
        {/* Tombol Sebelumnya */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-md transition-colors",
            currentPage === 1 ? "text-grey-2 cursor-not-allowed" : "text-primary-blue hover:bg-white-3"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </button>

        {/* Angka Halaman */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === 'number' ? (
                <button
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "w-8 h-8 flex justify-center items-center rounded-md transition-colors",
                    page === currentPage
                      ? "bg-primary-orange text-white-1"
                      : "text-primary-blue hover:bg-white-3"
                  )}
                >
                  {page}
                </button>
              ) : (
                <span className="px-2 py-1">...</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Tombol Selanjutnya */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-md transition-colors",
            currentPage === totalPages ? "text-grey-2 cursor-not-allowed" : "text-primary-blue hover:bg-white-3"
          )}
        >
          <span>Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}