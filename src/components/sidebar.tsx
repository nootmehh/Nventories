'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

import {
  Package2,
  Monitor, 
  ChevronDown, 
  Layers2, 
  RefreshCw, 
  Truck,
  Ellipsis,
  Building2,
} from 'lucide-react';
import { CustomButton } from './ui/customButton';
import Dropdown from './ui/dropdown';
import path from 'path';

const menuItems = [
  {
    name: 'Inventory report',
    icon: Monitor,
    path: 'outlet/report',
  },
  {
    name: 'Stock purchase',
    icon: Package2,
    path: '//Stock purchase',
    subItems: [
      {
        name: 'Purchase order',
        path: '/outlet/SP/purchase-order',
      },
      {
        name: 'Purchase invoice',
        path: '/outlet/SP/purchase-invoice',
      },
      {
        name: 'Stock in',
        path: '/outlet/SP/stock-in',
      },
    ],
  },
  {
    name: 'Manage stock',
    icon: Layers2,
    path: '//Manage stock',
    subItems: [
      {
        name: 'Raw material stock',
        path: '/outlet/MS/raw-material-stock',
      },
      {
        name: 'Production stock list',
        path: '/outlet/MS/production-stock-list',
      },
      {
        name: 'Stock out',
        path: '/outlet/MS/stock-out',
      },
      
    ],
  },
  {
    name: 'Return',
    icon: RefreshCw,
    path: '//Return',
    subItems: [
      {
        name: 'Purchase return',
        path: '/outlet/R/purchase-return',
      },
      {
        name: 'Return reconciliation',
        path: '/outlet/R/return-reconciliation',
      },
    ],
  }, {
    name: 'Supplier list',
    icon: Truck,
    path: '/outlet/supplier-list',
  },
  
];
const dynamicRoutes = [
    '/outlet/report',
    '/outlet/supplier-list',
    '/outlet/SP/purchase-order',
    '/outlet/SP/purchase-invoice',
    '/outlet/SP/stock-in',
    '/outlet/MS/raw-material-stock',
    '/outlet/MS/production-stock-list',
    '/outlet/MS/stock-out',
    '/outlet/R/purchase-return',
    '/outlet/R/return-reconciliation',
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { user, allOutlets, selectedOutletId, setSelectedOutletId } = useUser();
  const router = useRouter();
  const userRole = user?.role;

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuName) ? prev.filter((name) => name !== menuName) : [...prev, menuName]
    );
  };
  
  const outletOptions = allOutlets?.map((outlet) => ({
    label: outlet.outlet_name || 'Unnamed Outlet',
    value: String(outlet.id),
  })) || [];
  
  const checkAccess = (itemName: string) => {
    if (userRole === 'Owner') {
      return true;
    }
    if (userRole === 'Manager') {
      return true;
    }
    if (userRole === 'Employee') {
      return itemName !== 'Inventory report' && itemName !== 'Supplier list';
    }
    return false;
  };
  
  
  const handleOutletChange = (newOutletId: string) => {
    const newId = Number(newOutletId);
    setSelectedOutletId(newId);
    
    // Periksa apakah pathname saat ini adalah jalur dinamis
    const isCurrentRouteDynamic = dynamicRoutes.some(route => pathname.startsWith(route));
    
    if (isCurrentRouteDynamic) {
      const currentPathSegments = pathname.split('/');
      const newPathSegments = [...currentPathSegments.slice(0, currentPathSegments.length - 1), newId];
      const newPath = newPathSegments.join('/');
      router.push(newPath);
    }
  };
  

  return (
    <aside className="fixed top-18 left-0 w-64 h-[calc(100vh-4rem)] bg-white-1 p-4 shadow-md">
        <div className="w-full flex flex-col gap-3 mb-5">
          <div className="inline-flex items-center gap-2">
            <Building2 className="h-5 w-5 text-grey-desc" />
            <div className="font-semibold text-primary-blue">{user?.business?.businessName || 'Business name'}</div>
          </div>
          <div className='inline-flex gap-3 items-center'>
            <Dropdown
              className=''
              placeholder="Outlet not selected"
              options={outletOptions}
              value={String(selectedOutletId) || ''}
              onChange={handleOutletChange}
              required
            />
            <Link href="/outlet">
            <CustomButton
              variant="ghost"
              size="smallIcon"
              className="hidden md:flex"
              Icon={Ellipsis}
            />
            </Link>
          </div>
            
          
        </div>
      <nav>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} className="mb-2">
              {item.subItems ? (
                // Menu dengan sub-items
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
                      openMenus.includes(item.name) || pathname.startsWith(item.path)
                        ? 'bg-gradient-to-br from-primary-orange to-orange-400 text-white-1'
                        : 'text-grey-3 hover:bg-white-3'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${openMenus.includes(item.name) ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openMenus.includes(item.name) && (
                    <ul className="pl-2 pt-2">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex} className="mb-1">
                          <Link
                            key={index}
                            href={
                              subItem.path
                                ? selectedOutletId
                                  ? `${subItem.path}/${selectedOutletId}`
                                  : `${subItem.path}`
                                : '#'
                            }
                            className={`w-full block p-3 rounded-lg transition-colors text-sm font-medium ${
                              pathname.startsWith(subItem.path.replace(/^\/+/, '/'))
                                ? 'bg-white-2 text-primary-orange border-r-3 border-primary-orange'
                                : 'text-grey-3 hover:text-primary-orange hover:bg-white-2 hover:border-r-3'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                // Menu tanpa sub-items
                <Link
                  href={
                    item.path
                      ? selectedOutletId
                        ? `${item.path}/${selectedOutletId}`
                        : `${item.path}`
                      : '#'
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-sm font-medium ${
                    pathname === `${item.path}/${selectedOutletId}` || pathname === `/${item.path}`
                      ? 'bg-gradient-to-br from-primary-orange to-orange-400 text-white-1'
                      : 'text-grey-3 hover:bg-white-3'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}