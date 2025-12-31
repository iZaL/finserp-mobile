'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {Plus, Search, Package} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {useFishPurchases} from '@/hooks/use-fish-purchases';
import {useDebounce} from '@/hooks/use-debounce';
import type {FishPurchaseStatus} from '@/types/fish-purchase';
import {FishPurchasesGuard} from '@/components/permission-guard';
import {cn} from '@/lib/utils';

export default function FishPurchasesPage() {
  const router = useRouter();
  const t = useTranslations('fishPurchases');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FishPurchaseStatus>(
    'all'
  );

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {data, isLoading, error} = useFishPurchases({
    search: debouncedSearchQuery,
    status: statusFilter,
    per_page: 20,
  });

  const getStatusColor = (status: FishPurchaseStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'paid':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'closed':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <FishPurchasesGuard>
      <div className="container mx-auto p-4 pb-20">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('listDescription')}
            </p>
          </div>
          <Button onClick={() => router.push('/fish-purchases/new')}>
            <Plus className="mr-2 size-4" />
            {t('createNew')}
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-3 left-3 size-4" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as FishPurchaseStatus | 'all')
            }
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">{t('status.all')}</TabsTrigger>
              <TabsTrigger value="draft">{t('status.draft')}</TabsTrigger>
              <TabsTrigger value="pending">{t('status.pending')}</TabsTrigger>
              <TabsTrigger value="approved">{t('status.approved')}</TabsTrigger>
              <TabsTrigger value="paid">{t('status.paid')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State with Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4 text-sm">
                {t('errors.fetchFailed') || 'Failed to load fish purchases'}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.data.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="text-muted-foreground mb-4 size-12" />
              <h3 className="mb-2 text-lg font-semibold">{t('empty.title')}</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {t('empty.description')}
              </p>
              <Button onClick={() => router.push('/fish-purchases/new')}>
                <Plus className="mr-2 size-4" />
                {t('createFirst')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Purchase Cards */}
        {!isLoading && !error && data && data.data.length > 0 && (
          <div className="space-y-4">
            {data.data.map((purchase) => (
              <Card
                key={purchase.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/fish-purchases/${purchase.id}`)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">
                          {purchase.bill_number}
                        </h3>
                        <Badge
                          className={cn(
                            'text-xs',
                            getStatusColor(purchase.status)
                          )}
                        >
                          {t(`status.${purchase.status || 'null'}`)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {purchase.contact_name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {purchase.vehicle_number} • {purchase.driver_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary text-lg font-bold">
                        {purchase.total_amount.toFixed(2)} OMR
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {purchase.date_formatted ||
                          new Date(purchase.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t pt-3">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">
                        {t('summary.boxes')}
                      </p>
                      <p className="text-sm font-semibold">
                        {purchase.total_boxes}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">
                        {t('summary.weight')}
                      </p>
                      <p className="text-sm font-semibold">
                        {purchase.total_weight.toFixed(2)} kg
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">
                        {t('summary.location')}
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {purchase.location?.name || '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {data.meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.current_page === 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="text-muted-foreground text-sm">
                  {t('pagination.page')} {data.meta.current_page}{' '}
                  {t('pagination.of')} {data.meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.current_page === data.meta.last_page}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </FishPurchasesGuard>
  );
}
