'use client';

import {useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Warehouse,
  Package,
  TrendingUp,
  TrendingDown,
  Boxes,
  ChevronRight,
  Droplet,
  Wheat,
  Activity,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {useBatchStock, useBatchWarehouses} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import type {BatchStock} from '@/types/inventory';

// Format quantity with appropriate unit
function formatQuantity(quantity: number, showUnit = true): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})}${showUnit ? ' MT' : ''}`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 0})}${showUnit ? ' kg' : ''}`;
}

// Get warehouse gradient based on stock level
function getWarehouseGradient(stockPercentage: number, index: number) {
  const gradients = [
    {
      from: 'from-blue-500',
      to: 'to-indigo-600',
      light: 'from-blue-50 to-indigo-50',
    },
    {
      from: 'from-emerald-500',
      to: 'to-teal-600',
      light: 'from-emerald-50 to-teal-50',
    },
    {
      from: 'from-amber-500',
      to: 'to-orange-600',
      light: 'from-amber-50 to-orange-50',
    },
    {
      from: 'from-violet-500',
      to: 'to-purple-600',
      light: 'from-violet-50 to-purple-50',
    },
    {
      from: 'from-rose-500',
      to: 'to-pink-600',
      light: 'from-rose-50 to-pink-50',
    },
    {
      from: 'from-cyan-500',
      to: 'to-blue-600',
      light: 'from-cyan-50 to-blue-50',
    },
  ];
  return gradients[index % gradients.length];
}

interface WarehouseData {
  id: number;
  name: string;
  batches: BatchStock[];
  totalQuantity: number;
  batchCount: number;
  productTypes: {
    name: string;
    code: string;
    quantity: number;
    percentage: number;
  }[];
}

interface WarehouseCardProps {
  warehouse: WarehouseData;
  index: number;
  onClick: () => void;
}

function WarehouseCard({warehouse, index, onClick}: WarehouseCardProps) {
  const t = useTranslations('inventory.warehouses');
  const gradient = getWarehouseGradient(100, index);
  const maxProductQuantity = Math.max(
    ...warehouse.productTypes.map((p) => p.quantity),
    1
  );

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onClick={onClick}
    >
      {/* Header with gradient */}
      <div
        className={cn(
          'relative overflow-hidden rounded-t-xl bg-gradient-to-br p-5 text-white',
          gradient.from,
          gradient.to
        )}
      >
        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 size-20 rounded-full bg-white/5" />
        <div className="absolute top-4 right-4 size-8 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
              <Warehouse className="size-6" />
            </div>
            <ChevronRight className="size-5 opacity-60 transition-transform group-hover:translate-x-1" />
          </div>

          <h3 className="mb-1 text-lg font-bold">{warehouse.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {formatQuantity(warehouse.totalQuantity, false)}
            </span>
            <span className="text-sm font-medium text-white/80">
              {warehouse.totalQuantity >= 1000 ? 'MT' : 'kg'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <CardContent className="p-4">
        {/* Quick stats */}
        <div className="bg-muted/50 mb-4 flex items-center justify-between rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
              <Package className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('batches')}</p>
              <p className="text-sm font-semibold">{warehouse.batchCount}</p>
            </div>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
              <Boxes className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {t('productTypes')}
              </p>
              <p className="text-sm font-semibold">
                {warehouse.productTypes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Product type breakdown */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t('stockBreakdown')}
          </p>
          {warehouse.productTypes.map((pt) => {
            const isFishmeal = pt.code === 'fishmeal';
            const Icon = isFishmeal ? Wheat : Droplet;
            const barColor = isFishmeal ? 'bg-amber-500' : 'bg-blue-500';
            const iconColor = isFishmeal ? 'text-amber-600' : 'text-blue-600';
            const barWidth = (pt.quantity / maxProductQuantity) * 100;

            return (
              <div key={pt.code} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('size-4', iconColor)} />
                    <span className="text-sm font-medium">{pt.name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatQuantity(pt.quantity)}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      barColor
                    )}
                    style={{width: `${barWidth}%`}}
                  />
                </div>
              </div>
            );
          })}

          {warehouse.productTypes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <Package className="text-muted-foreground/50 mb-2 size-8" />
              <p className="text-muted-foreground text-sm">{t('noStock')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Summary stat card
function SummaryCard({
  icon: Icon,
  label,
  value,
  subValue,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white',
        gradient
      )}
    >
      <div className="absolute -top-2 -right-2 size-16 rounded-full bg-white/10" />
      <div className="relative">
        <div className="mb-2 inline-flex rounded-lg bg-white/20 p-2">
          <Icon className="size-5" />
        </div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subValue && <p className="text-xs text-white/70">{subValue}</p>}
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const router = useRouter();
  const t = useTranslations('inventory.warehouses');

  // Fetch data
  const {data: warehouses, isLoading: warehousesLoading} = useBatchWarehouses();
  const {data: batches, isLoading: batchesLoading} = useBatchStock();

  // Process warehouse data
  const warehouseData = useMemo(() => {
    if (!warehouses || !batches) return [];

    return warehouses
      .map((wh) => {
        const warehouseBatches = batches.filter(
          (b) => b.warehouse_id === wh.id
        );
        const totalQuantity = warehouseBatches.reduce(
          (sum, b) => sum + b.quantity,
          0
        );

        // Group by product type
        const productTypeMap = warehouseBatches.reduce(
          (acc, batch) => {
            const key = batch.product_type;
            if (!acc[key]) {
              acc[key] = {
                name: batch.product_type,
                code:
                  batch.product_type_code ||
                  batch.product_type.toLowerCase().replace(/\s+/g, '_'),
                quantity: 0,
              };
            }
            acc[key].quantity += batch.quantity;
            return acc;
          },
          {} as Record<string, {name: string; code: string; quantity: number}>
        );

        const productTypes = Object.values(productTypeMap).map((pt) => ({
          ...pt,
          percentage:
            totalQuantity > 0 ? (pt.quantity / totalQuantity) * 100 : 0,
        }));

        return {
          id: wh.id,
          name: wh.name,
          batches: warehouseBatches,
          totalQuantity,
          batchCount: warehouseBatches.length,
          productTypes,
        };
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity); // Sort by stock quantity
  }, [warehouses, batches]);

  // Calculate totals
  const totalStock = warehouseData.reduce((sum, w) => sum + w.totalQuantity, 0);
  const totalBatches = warehouseData.reduce((sum, w) => sum + w.batchCount, 0);
  const activeWarehouses = warehouseData.filter(
    (w) => w.totalQuantity > 0
  ).length;

  const isLoading = warehousesLoading || batchesLoading;

  return (
    <InventoryGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-20">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push('/inventory')}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto space-y-6 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard
                  icon={Warehouse}
                  label={t('totalWarehouses')}
                  value={warehouseData.length.toString()}
                  subValue={`${activeWarehouses} ${t('active')}`}
                  gradient="from-blue-500 to-indigo-600"
                />
                <SummaryCard
                  icon={Boxes}
                  label={t('totalStock')}
                  value={formatQuantity(totalStock, false)}
                  subValue={totalStock >= 1000 ? 'MT' : 'kg'}
                  gradient="from-emerald-500 to-teal-600"
                />
                <SummaryCard
                  icon={Package}
                  label={t('totalBatches')}
                  value={totalBatches.toString()}
                  gradient="from-amber-500 to-orange-600"
                />
              </div>

              {/* Warehouse Cards */}
              <div>
                <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                  {t('allWarehouses')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {warehouseData.map((warehouse, index) => (
                    <WarehouseCard
                      key={warehouse.id}
                      warehouse={warehouse}
                      index={index}
                      onClick={() =>
                        router.push(`/inventory/warehouses/${warehouse.id}`)
                      }
                    />
                  ))}
                </div>

                {warehouseData.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="bg-muted mb-4 rounded-full p-4">
                        <Warehouse className="text-muted-foreground size-8" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">
                        {t('empty.title')}
                      </h3>
                      <p className="text-muted-foreground max-w-[250px] text-center text-sm">
                        {t('empty.description')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </InventoryGuard>
  );
}
