'use client';

import { useEffect, useState } from "react";

import { CustomButton } from "@/components/ui/customButton";
import { CustomInput } from "@/components/ui/input";
import EmptyStateTable from "@/components/EmptyStateTable";
import "@/app/globals.css";

import { Plus, Pencil, Search } from 'lucide-react';
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

export default function RawMaterialStockPage() {
    const { user, allOutlets } = useUser();
    const params = useParams();
    const router = useRouter();
    const outletId = params.id as string;

    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');

    const fetchRawMaterials = async (query = '') => {
        setLoading(true);
        if (!outletId) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `/api/outlets/MS/raw-material/list?outletId=${outletId}&q=${encodeURIComponent(query)}`
            );
            const result = await response.json();

            if (response.ok) {
                setRawMaterials(result.data);
            } else {
                console.error("Failed to fetch raw materials:", result.message);
                setRawMaterials([]);
            }
        } catch (error) {
            console.error("Connection error while fetching raw materials:", error);
            setRawMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
  if (!outletId) return;

  const fetchRawMaterial = async () => {
    try {
      const res = await fetch(`/api/outlets/raw-material/edit/${outletId}`);
      const data = await res.json();

      if (res.ok) {
        // update state sesuai data
        console.log("Fetched raw material:", data.data);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Failed to fetch raw material:", err);
    }
  };

  fetchRawMaterial();
}, [outletId]);


    // Fetch when searchQuery changes (with debounce)
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRawMaterials(searchQuery);
        }, 300); // delay 300ms

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const currentOutlet = allOutlets?.find(outlet => String(outlet.id) === outletId);

    return (
        <div className='w-full'>
            <div className="w-full px-8 py-6 bg-white-1 rounded-2xl flex flex-col shadow-sm">
                <div className="flex justify-between items-center w-full mb-6">
                    <div>
                        <h1 className="font-semibold text-lg text-primary-blue">
                            Raw Material Stock List <span className="text-grey-desc font-medium">| {currentOutlet?.outlet_name || 'Outlet Not Found'}</span>
                        </h1>
                        <p className="text-sm font-medium text-grey-desc">Showing newest</p>
                    </div>
                    <Link href={`/form/outlet/MS/add-raw-material/${outletId}`}>
                        <CustomButton variant="primary" size="lg" iconPlacement="right" Icon={Plus}>
                            Add Stock
                        </CustomButton>
                    </Link>
                </div>

                {/* Search input */}
                <div className="self-stretch w-full flex justify-start mb-4">
                    <CustomInput
                        placeholder="Search raw material"
                        className="w-64 gap-3"
                        iconLeft={<Search />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="w-full flex flex-col gap-[2px]">
                    <div className="bg-white-2 px-3 py-4 w-full border-1 border-white-3 inline-flex items-center justify-start gap-6 text-grey-desc font-semibold uppercase text-sm">
                        <div className="min-w-6">No.</div>
                        <div className="w-full">Name</div>
                        <div className="w-full">SKU</div>
                        <div className="w-full">Opening stock</div>
                        <div className="w-full">Stock in</div>
                        <div className="w-full">Stock out</div>
                        <div className="w-full">Remaining Stock</div>
                        <div className="w-full">Unit</div>
                        <div className="w-full">Price per unit (Rp)</div>
                        <div className="collapse">
                            <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="w-full text-center py-8 text-grey-desc">Loading raw materials...</div>
                    ) : rawMaterials.length > 0 ? (
                        rawMaterials.map((item, index) => (
                            <div key={item.id} className="px-3 py-4 w-full border-b border-white-3 inline-flex items-center justify-start gap-6 text-grey-2 font-medium text-sm">
                                <div className="min-w-6">{index + 1}.</div>
                                <div className="w-full">{item.material_name}</div>
                                <div className="w-full">{item.sku}</div>
                                <div className="w-full">{item.opening_stock}</div>
                                <div className="w-full">{item.stock_in || 0}</div>
                                <div className="w-full">{item.stock_out || 0}</div>
                                <div className="w-full">{item.remaining_stock}</div>
                                <div className="w-full">{item.unit_name}</div>
                                <div className="w-full">
                                    {Number(item.price_per_unit).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </div>
                                <Link href={`/form/outlet/MS/edit-raw-material/${item.id}`}>
                                    <div className="flex justify-end">
                                        <CustomButton variant="ghost" size="smallIcon" Icon={Pencil} />
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        <EmptyStateTable
                            title="No raw material found"
                            orangeDesc="Add stock"
                            description=" to create new raw material stock list."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
