'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {
  Phone,
  MessageCircle,
  Search,
  Users,
  Loader2,
  MapPin,
} from 'lucide-react';
import {toast} from 'sonner';
import {api} from '@/lib/api';
import {SuppliersGuard} from '@/components/permission-guard';
import axios from 'axios';

interface Supplier {
  name: string;
  phone: string;
  location: string;
  last_booking: string;
}

interface GroupedSuppliers {
  [location: string]: Supplier[];
}

export default function SuppliersPage() {
  const t = useTranslations();
  const [suppliers, setSuppliers] = useState<GroupedSuppliers>({});
  const [filteredSuppliers, setFilteredSuppliers] = useState<GroupedSuppliers>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const abortController = new AbortController();

    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/suppliers', {
          signal: abortController.signal,
        });

        if (response.data?.data) {
          setSuppliers(response.data.data);
          setFilteredSuppliers(response.data.data);
        }
      } catch (error: unknown) {
        if (!axios.isCancel(error)) {
          console.error('Failed to fetch suppliers:', error);
          toast.error(t('suppliers.errors.fetchFailed'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSuppliers();

    return () => {
      abortController.abort();
    };
  }, [t]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery === '') {
        setFilteredSuppliers(suppliers);
      } else {
        const filtered: GroupedSuppliers = {};
        Object.entries(suppliers).forEach(([location, suppliersList]) => {
          const matchedSuppliers = suppliersList.filter(
            (supplier) =>
              supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              supplier.phone.includes(searchQuery)
          );
          if (matchedSuppliers.length > 0) {
            filtered[location] = matchedSuppliers;
          }
        });
        setFilteredSuppliers(filtered);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, suppliers]);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    // Remove any non-digit characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const totalSuppliers = Object.values(filteredSuppliers).reduce(
    (acc, list) => acc + list.length,
    0
  );

  return (
    <SuppliersGuard>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('suppliers.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? t('common.loading')
                : t('suppliers.subtitle', {count: totalSuppliers})}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={t('suppliers.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalSuppliers === 0 && (
          <Card className="p-12 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {t('suppliers.noSuppliersFound')}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? t('suppliers.noSearchResults')
                : t('suppliers.noSuppliersDescription')}
            </p>
          </Card>
        )}

        {/* Suppliers List Grouped by Location */}
        {!isLoading &&
          Object.entries(filteredSuppliers).map(([location, suppliersList]) => (
            <div key={location} className="space-y-3">
              {/* Location Header */}
              <div className="flex items-center gap-2 px-2">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                  {location || t('suppliers.unknownLocation')}
                </h2>
                <div className="border-border flex-1 border-b" />
                <span className="text-muted-foreground text-xs">
                  {suppliersList.length} {t('suppliers.suppliers')}
                </span>
              </div>

              {/* Suppliers Cards */}
              <div className="space-y-2">
                {suppliersList.map((supplier, index) => (
                  <Card
                    key={`${supplier.name}-${supplier.phone}-${index}`}
                    className="p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Supplier Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold">
                          {supplier.name}
                        </h3>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                          {supplier.phone}
                        </p>
                        {supplier.last_booking && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {t('suppliers.lastBooking')}:{' '}
                            {new Date(
                              supplier.last_booking
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-11 w-11 rounded-full transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20 dark:hover:text-green-400"
                          onClick={() => handleCall(supplier.phone)}
                        >
                          <Phone className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-11 w-11 rounded-full transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20 dark:hover:text-green-400"
                          onClick={() => handleWhatsApp(supplier.phone)}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>
    </SuppliersGuard>
  );
}
