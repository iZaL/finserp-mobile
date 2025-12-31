'use client';

import {useMemo, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Package,
  ArrowRightLeft,
  Plus,
  MoreVertical,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Boxes,
  Clock,
  AlertCircle,
  Droplet,
  Wheat,
  Activity,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';
import {useBatchStock, useBatchMovements} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import {TransferDialog} from '@/components/inventory/transfer-dialog';
import type {BatchStock, BatchMovement} from '@/types/inventory';
import {formatDistanceToNow} from 'date-fns';

// Format quantity with appropriate unit
function formatQuantity(quantity: number, showUnit = true): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})}${showUnit ? ' MT' : ''}`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 0})}${showUnit ? ' kg' : ''}`;
}

// Summary stat card with gradient
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
      <div className="absolute -bottom-3 -left-3 size-12 rounded-full bg-white/5" />
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

// Product Type Card with enhanced design
interface ProductTypeCardProps {
  name: string;
  code: string;
  total: number;
  batchCount: number;
  warehouseCount: number;
  percentage: number;
  maxQuantity: number;
}

function ProductTypeCard({
  name,
  code,
  total,
  batchCount,
  warehouseCount,
  percentage,
  maxQuantity,
}: ProductTypeCardProps) {
  const isFishmeal = code === 'fishmeal';
  const Icon = isFishmeal ? Wheat : Droplet;
  const gradient = isFishmeal
    ? 'from-amber-500 to-orange-600'
    : 'from-blue-500 to-cyan-600';
  const lightGradient = isFishmeal
    ? 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
    : 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30';
  const barColor = isFishmeal ? 'bg-amber-500' : 'bg-blue-500';
  const iconColor = isFishmeal
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-blue-600 dark:text-blue-400';
  const barWidth = maxQuantity > 0 ? (total / maxQuantity) * 100 : 0;

  return (
    <Card className="group overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Header with gradient */}
      <div
        className={cn(
          'relative overflow-hidden rounded-t-xl bg-gradient-to-br p-4 text-white',
          gradient
        )}
      >
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 size-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-3 -left-3 size-14 rounded-full bg-white/5" />
        <div className="absolute top-3 right-3 size-6 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
              <Icon className="size-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur-sm">
              <span>{percentage.toFixed(1)}%</span>
            </div>
          </div>

          <h3 className="mb-1 text-base font-bold">{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight">
              {formatQuantity(total, false)}
            </span>
            <span className="text-sm font-medium text-white/80">
              {total >= 1000 ? 'MT' : 'kg'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Package className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">{batchCount}</span>
              <span className="text-muted-foreground text-xs">batches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Warehouse className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">{warehouseCount}</span>
              <span className="text-muted-foreground text-xs">locations</span>
            </div>
          </div>
        </div>

        {/* Stock bar */}
        <div className="mt-3">
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
      </CardContent>
    </Card>
  );
}

// Warehouse Card with enhanced design
interface WarehouseData {
  warehouseId: number;
  warehouseName: string;
  batches: BatchStock[];
  totalQuantity: number;
  productTypes: {
    name: string;
    code: string;
    quantity: number;
  }[];
}

function WarehouseCard({
  warehouse,
  index,
  onViewDetails,
  onTransferBatch,
}: {
  warehouse: WarehouseData;
  index: number;
  onViewDetails: () => void;
  onTransferBatch: (batchId: number) => void;
}) {
  const t = useTranslations('inventory');

  const gradients = [
    {from: 'from-blue-500', to: 'to-indigo-600'},
    {from: 'from-emerald-500', to: 'to-teal-600'},
    {from: 'from-amber-500', to: 'to-orange-600'},
    {from: 'from-violet-500', to: 'to-purple-600'},
    {from: 'from-rose-500', to: 'to-pink-600'},
    {from: 'from-cyan-500', to: 'to-blue-600'},
  ];
  const gradient = gradients[index % gradients.length];

  const maxProductQuantity = Math.max(
    ...warehouse.productTypes.map((p) => p.quantity),
    1
  );

  return (
    <Card className="group overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Header with gradient */}
      <button
        onClick={onViewDetails}
        className={cn(
          'relative w-full overflow-hidden rounded-t-xl bg-gradient-to-br p-4 text-left text-white',
          gradient.from,
          gradient.to
        )}
      >
        {/* Background decoration */}
        <div className="absolute -top-4 -right-4 size-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-3 -left-3 size-14 rounded-full bg-white/5" />
        <div className="absolute top-3 right-3 size-6 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
              <Warehouse className="size-5" />
            </div>
            <ChevronRight className="size-5 opacity-60 transition-transform group-hover:translate-x-1" />
          </div>

          <h3 className="mb-1 text-base font-bold">
            {warehouse.warehouseName}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight">
              {formatQuantity(warehouse.totalQuantity, false)}
            </span>
            <span className="text-sm font-medium text-white/80">
              {warehouse.totalQuantity >= 1000 ? 'MT' : 'kg'}
            </span>
          </div>
        </div>
      </button>

      {/* Content section */}
      <CardContent className="p-4">
        {/* Quick stats */}
        <div className="bg-muted/50 mb-4 flex items-center justify-between rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30">
              <Package className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Batches</p>
              <p className="text-sm font-semibold">
                {warehouse.batches.length}
              </p>
            </div>
          </div>
          <div className="bg-border h-8 w-px" />
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
              <Boxes className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Types</p>
              <p className="text-sm font-semibold">
                {warehouse.productTypes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Product type breakdown */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Stock Breakdown
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
              <p className="text-muted-foreground text-sm">No stock</p>
            </div>
          )}
        </div>

        {/* Recent batches preview */}
        {warehouse.batches.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Recent Batches
            </p>
            <div className="space-y-2">
              {warehouse.batches.slice(0, 2).map((batch) => (
                <div
                  key={batch.id}
                  className="bg-muted/50 flex items-center justify-between rounded-lg p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                      <Package className="text-muted-foreground size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{batch.batch_code}</p>
                      <p className="text-muted-foreground text-xs">
                        {batch.product_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatQuantity(batch.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTransferBatch(batch.id);
                      }}
                      title={t('transferLabel')}
                    >
                      <ArrowRightLeft className="text-muted-foreground size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {warehouse.batches.length > 2 && (
                <button
                  onClick={onViewDetails}
                  className="text-primary w-full py-1 text-center text-xs font-medium hover:underline"
                >
                  +{warehouse.batches.length - 2} more batches
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Movement Item Component with enhanced design
function MovementItem({movement}: {movement: BatchMovement}) {
  const t = useTranslations('inventory.movements');

  const getTypeLabel = () => {
    switch (movement.type) {
      case 'transfer_in':
        return t('types.transfer_in') || 'Transfer In';
      case 'transfer_out':
        return t('types.transfer_out') || 'Transfer Out';
      case 'adjustment':
        return t('types.adjustment') || 'Adjustment';
      case 'production':
        return t('types.production') || 'Production';
      default:
        return movement.type;
    }
  };

  const isPositive =
    movement.type === 'transfer_in' ||
    (movement.type === 'adjustment' &&
      movement.adjustment_type === 'addition') ||
    movement.type === 'production';

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-xl',
          isPositive
            ? 'bg-emerald-100 dark:bg-emerald-950/50'
            : 'bg-red-100 dark:bg-red-950/50'
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="size-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowDownRight className="size-5 text-red-600 dark:text-red-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{movement.batch_code}</p>
        <p className="text-muted-foreground truncate text-xs">
          {getTypeLabel()} • {movement.warehouse_name}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          {isPositive ? '+' : '-'}
          {movement.quantity.toLocaleString()}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(movement.date), {addSuffix: true})}
        </p>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const t = useTranslations('inventory');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | undefined>();

  // Fetch data
  const {
    data: batches,
    isLoading: batchesLoading,
    error: batchesError,
    refetch: refetchBatches,
  } = useBatchStock();
  const {
    data: movementsData,
    isLoading: movementsLoading,
    refetch: refetchMovements,
  } = useBatchMovements({per_page: 5});

  const handleTransferBatch = (batchId: number) => {
    setTransferBatchId(batchId);
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    refetchBatches();
    refetchMovements();
  };

  const movements = movementsData?.data || [];

  // Group batches by product type for summary cards
  const productTypeSummary = useMemo(() => {
    if (!batches) return [];

    const grouped = batches.reduce(
      (acc, batch) => {
        const key = batch.product_type;
        if (!acc[key]) {
          acc[key] = {
            name: batch.product_type,
            code:
              batch.product_type_code ||
              batch.product_type.toLowerCase().replace(/\s+/g, '_'),
            total: 0,
            count: 0,
            warehouses: new Set<number>(),
          };
        }
        acc[key].total += batch.quantity;
        acc[key].count += 1;
        acc[key].warehouses.add(batch.warehouse_id);
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          code: string;
          total: number;
          count: number;
          warehouses: Set<number>;
        }
      >
    );

    const totalQuantity = Object.values(grouped).reduce(
      (sum, pt) => sum + pt.total,
      0
    );
    const maxQuantity = Math.max(
      ...Object.values(grouped).map((pt) => pt.total)
    );

    return Object.values(grouped).map((pt) => ({
      name: pt.name,
      code: pt.code,
      total: pt.total,
      count: pt.count,
      warehouseCount: pt.warehouses.size,
      percentage: totalQuantity > 0 ? (pt.total / totalQuantity) * 100 : 0,
      maxQuantity,
    }));
  }, [batches]);

  // Group batches by warehouse
  const warehouseData = useMemo(() => {
    if (!batches) return [];

    const grouped = batches.reduce(
      (acc, batch) => {
        const key = batch.warehouse_name;
        if (!acc[key]) {
          acc[key] = {
            warehouseId: batch.warehouse_id,
            warehouseName: batch.warehouse_name,
            batches: [],
            totalQuantity: 0,
            productTypeMap: {} as Record<
              string,
              {name: string; code: string; quantity: number}
            >,
          };
        }
        acc[key].batches.push(batch);
        acc[key].totalQuantity += batch.quantity;

        const ptKey = batch.product_type;
        if (!acc[key].productTypeMap[ptKey]) {
          acc[key].productTypeMap[ptKey] = {
            name: batch.product_type,
            code:
              batch.product_type_code ||
              batch.product_type.toLowerCase().replace(/\s+/g, '_'),
            quantity: 0,
          };
        }
        acc[key].productTypeMap[ptKey].quantity += batch.quantity;
        return acc;
      },
      {} as Record<
        string,
        {
          warehouseId: number;
          warehouseName: string;
          batches: BatchStock[];
          totalQuantity: number;
          productTypeMap: Record<
            string,
            {name: string; code: string; quantity: number}
          >;
        }
      >
    );

    return Object.values(grouped)
      .map((wh) => ({
        ...wh,
        productTypes: Object.values(wh.productTypeMap),
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [batches]);

  // Calculate totals
  const totalBatches = batches?.length || 0;
  const totalQuantity = batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
  const warehouseCount = warehouseData.length;

  const isLoading = batchesLoading;
  const hasError = batchesError;
  const isEmpty = !batches || batches.length === 0;

  return (
    <InventoryGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-20">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push('/inventory/transfer')}
                >
                  <ArrowRightLeft className="me-2 size-4" />
                  {t('actions.newTransfer')}
                </DropdownMenuItem>
                {/* TODO: Re-enable when adjustment feature is ready
                <DropdownMenuItem
                  onClick={() => router.push('/inventory/adjustment')}
                >
                  <Plus className="me-2 size-4" />
                  {t('actions.newAdjustment')}
                </DropdownMenuItem>
                */}
              </DropdownMenuContent>
            </DropdownMenu>
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
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="text-destructive mb-4 size-12" />
                <p className="text-destructive mb-4 text-sm">
                  {t('error') || 'Failed to load inventory'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  {t('retry') || 'Retry'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && isEmpty && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted mb-4 rounded-full p-4">
                  <Package className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t('empty.title') || 'No Inventory'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-[250px] text-center text-sm">
                  {t('empty.description') ||
                    'No batch inventory found. Stock will appear here once production batches are created.'}
                </p>
                <Button onClick={() => router.push('/production-outputs/new')}>
                  <Plus className="me-2 size-4" />
                  Create Production Output
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {!isLoading && !hasError && !isEmpty && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard
                  icon={Boxes}
                  label={t('totalStock') || 'Total Stock'}
                  value={formatQuantity(totalQuantity, false)}
                  subValue={totalQuantity >= 1000 ? 'MT' : 'kg'}
                  gradient="from-blue-500 to-indigo-600"
                />
                <SummaryCard
                  icon={Package}
                  label={t('totalBatches') || 'Batches'}
                  value={totalBatches.toString()}
                  subValue={`${productTypeSummary.length} types`}
                  gradient="from-emerald-500 to-teal-600"
                />
                <SummaryCard
                  icon={Warehouse}
                  label={t('warehouses.totalWarehouses') || 'Warehouses'}
                  value={warehouseCount.toString()}
                  subValue="locations"
                  gradient="from-amber-500 to-orange-600"
                />
              </div>

              {/* Product Type Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                {productTypeSummary.map((pt) => (
                  <ProductTypeCard
                    key={pt.code}
                    name={pt.name}
                    code={pt.code}
                    total={pt.total}
                    batchCount={pt.count}
                    warehouseCount={pt.warehouseCount}
                    percentage={pt.percentage}
                    maxQuantity={pt.maxQuantity}
                  />
                ))}
              </div>

              {/* Warehouse Overview */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                    {t('warehouseOverview')}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-auto p-0 text-xs font-medium hover:bg-transparent hover:underline"
                    onClick={() => router.push('/inventory/warehouses')}
                  >
                    {t('viewAll')}
                    <ChevronRight className="ml-1 size-3" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {warehouseData.map((warehouse, index) => (
                    <WarehouseCard
                      key={warehouse.warehouseId}
                      warehouse={warehouse}
                      index={index}
                      onViewDetails={() =>
                        router.push(
                          `/inventory/warehouses/${warehouse.warehouseId}`
                        )
                      }
                      onTransferBatch={handleTransferBatch}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                      {t('recentMovements')}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-auto p-0 text-xs font-medium hover:bg-transparent hover:underline"
                    onClick={() => router.push('/inventory/movements')}
                  >
                    {t('viewAll')}
                    <ChevronRight className="ml-1 size-3" />
                  </Button>
                </div>
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardContent className="p-0">
                    {movementsLoading && (
                      <div className="space-y-3 p-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="size-10 rounded-xl" />
                            <div className="flex-1">
                              <Skeleton className="mb-1.5 h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!movementsLoading && movements && movements.length > 0 && (
                      <div className="divide-y px-4">
                        {movements.map((movement) => (
                          <MovementItem key={movement.id} movement={movement} />
                        ))}
                      </div>
                    )}

                    {!movementsLoading &&
                      (!movements || movements.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="bg-muted mb-3 rounded-full p-3">
                            <Clock className="text-muted-foreground size-5" />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {t('movements.empty') || 'No recent movements'}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* Transfer Dialog */}
        <TransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          batchId={transferBatchId}
          onSuccess={handleTransferSuccess}
        />
      </div>
    </InventoryGuard>
  );
}
