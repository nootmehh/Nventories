'use client';

import React, { useState, useEffect } from 'react';
import { CustomButton } from '@/components/ui/customButton';
import { CustomInput } from '@/components/ui/input';
import { Check, Search, X } from 'lucide-react';

interface Product {
  id: number;
  material_name: string;
  sku: string;
  unit_name: string;
  remaining_stock: number;
  price_per_unit: number;
  quantity: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSaveAction: (products: Product[]) => void;
  outletId: string;
}

export default function ProductModal({ isOpen, onCloseAction, onSaveAction, outletId }: ProductModalProps) {
  const [rawMaterials, setRawMaterials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('outletId', outletId);
      if (searchQuery) params.append('q', searchQuery);

      const response = await fetch(`/api/outlets/MS/raw-material/list?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setRawMaterials(result.data.map((item: any) => ({
          ...item,
          price_per_unit: Number(item.price_per_unit), // ensure number
          remaining_stock: item.remaining_stock != null ? Number(item.remaining_stock) : 0,
        })));
      } else {
        setRawMaterials([]);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setRawMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRawMaterials();
    }
  }, [isOpen, searchQuery, outletId]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev => {
      if (prev.find(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const handleSave = () => {
  onSaveAction(selectedProducts);
  onCloseAction();
  };

  const formatPrice = (price: number) => {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-blue">Add Product</h2>
      <CustomButton variant="ghost" size="smallIcon" onClick={onCloseAction} Icon={X} />
        </div>

        <div className="mb-4">
          <CustomInput
            placeholder="Search stock"
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft={<Search className="h-5 w-5 text-gray-400" />}
          />
        </div>

          <div className="overflow-x-auto">
          <div className="bg-white-2 px-3 py-3 self-stretch w-full border-1 border-white-3 inline-flex justify-start gap-6 text-grey-desc text-sm font-semibold uppercase items-center">
            <div className="w-full">SKU</div>
            <div className="w-full">Product</div>
            <div className="w-full">Unit</div>
            <div className="w-full">Current Stock</div>
            <div className="w-full">Price per unit (Rp)</div>
            <div className="w-70">Select</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : rawMaterials.length > 0 ? (
              rawMaterials.map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="px-3 py-4 self-stretch w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 text-sm font-medium"
                  >
                    <div className="w-full">{product.sku}</div>
                    <div className="w-full">{product.material_name}</div>
                    <div className="w-full">{product.unit_name}</div>
                    <div className="w-full">{product.remaining_stock}</div>
                    <div className="w-full">{formatPrice(product.price_per_unit)}</div>
                    <div className="w-70 items-center justify-center">
                      <label className="relative flex items-center justify-center w-5 h-5 rounded-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <span
                          className={` flex items-center justify-center w-full h-full transition-colors rounded-sm duration-150 ${
                            isSelected ? 'bg-primary-orange' : 'bg-transparent border-1 border-grey-2'
                          }`}
                        >
                          {isSelected && <Check size={14} className="text-white-1" />}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">No product found.</div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <CustomButton variant="ghost" onClick={onCloseAction}>Cancel</CustomButton>
          <CustomButton variant="primary" onClick={() => onSaveAction(selectedProducts)}>Save product</CustomButton>
        </div>
      </div>
    </div>
  );
}
