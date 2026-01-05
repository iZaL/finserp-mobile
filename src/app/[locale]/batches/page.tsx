'use client';

import {useMemo, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Package,
  ArrowRightLeft,
  Search,
  AlertCircle,
  Warehouse as WarehouseIcon,
  X,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import {useBatchStock} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import type {BatchStock} from '@/types/inventory';

// Product type color mapping for visual coding
function getProductTypeStyle(code: string): {
  bg: string;
  border: string;
  text: string;
} {
  const lowerCode = code.toLowerCase();
  if (lowerCode.includes('fishmeal') || lowerCode === 'fishmeal') {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
    };
  }
  if (
    lowerCode.includes('fish oil') ||
    lowerCode.includes('fishoil') ||
    lowerCode === 'fish_oil'
  ) {
    return {bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700'};
  }
  // Dynamic colors for other types
  const styles = [
    {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-700',
    },
    {bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700'},
    {bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700'},
    {bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700'},
  ];
  const hash = code
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return styles[hash % styles.length];
}

// Format quantity compactly
function formatQuantityCompact(quantity: number): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 1})}MT`;
  }
  return `${Math.round(quantity)}kg`;
}

// Filter pill component
function FilterPill({
  label,
  count,
  isSelected,
  onClick,
  colorClass,
}: {
  label: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
        isSelected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-muted'
      )}
    >
      {colorClass && <span className={cn('size-2 rounded-full', colorClass)} />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'text-xs',
            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          ({count})
        </span>
      )}
    </button>
  );
}

// Batch seat/tile component - compact like flight seat
function BatchSeat({
  batch,
  isSelected,
  onSelect,
}: {
  batch: BatchStock;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const productCode =
    batch.product_type_code ||
    batch.product_type.toLowerCase().replace(/\s+/g, '_');
  const style = getProductTypeStyle(productCode);

  // Format date very compactly
  const prodDate = batch.production_date
    ? new Date(batch.production_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Package info
  const hasPackages =
    batch.can_be_packaged && batch.package_count && batch.package_count > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start rounded-lg border-2 p-2 text-left transition-all',
        'active:scale-95',
        style.bg,
        style.border,
        isSelected && 'ring-primary ring-2 ring-offset-2'
      )}
    >
      {/* Batch code - truncated */}
      <span className={cn('w-full truncate text-xs font-bold', style.text)}>
        {batch.batch_name || batch.batch_code}
      </span>

      {/* Bags / Weight */}
      <span className="text-foreground mt-0.5 text-sm font-semibold">
        {hasPackages
          ? `${batch.package_count} bags`
          : formatQuantityCompact(batch.quantity)}
      </span>

      {/* Weight in parens if bags shown */}
      {hasPackages && (
        <span className="text-muted-foreground text-[10px]">
          ({formatQuantityCompact(batch.quantity)})
        </span>
      )}

      {/* Date */}
      {prodDate && (
        <span className="text-muted-foreground mt-0.5 text-[10px]">
          {prodDate}
        </span>
      )}
    </button>
  );
}

// Selected batch detail panel
function BatchDetailPanel({
  batch,
  onClose,
  onTransfer,
}: {
  batch: BatchStock;
  onClose: () => void;
  onTransfer: () => void;
}) {
  const productCode =
    batch.product_type_code ||
    batch.product_type.toLowerCase().replace(/\s+/g, '_');
  const style = getProductTypeStyle(productCode);
  const hasPackages =
    batch.can_be_packaged && batch.package_count && batch.package_count > 0;

  const prodDate = batch.production_date
    ? new Date(batch.production_date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className={cn('rounded-xl border-2 p-4', style.bg, style.border)}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className={cn('text-lg font-bold', style.text)}>
            {batch.batch_name || batch.batch_code}
          </h3>
          <p className="text-muted-foreground text-sm">{batch.product_type}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-muted-foreground text-xs">Quantity</p>
          <p className="font-semibold">
            {hasPackages
              ? `${batch.package_count} bags`
              : formatQuantityCompact(batch.quantity)}
          </p>
          {hasPackages && (
            <p className="text-muted-foreground text-xs">
              ({formatQuantityCompact(batch.quantity)})
            </p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Warehouse</p>
          <p className="font-semibold">{batch.warehouse_name}</p>
        </div>
        {prodDate && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Production Date</p>
            <p className="font-semibold">{prodDate}</p>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onTransfer}>
        <ArrowRightLeft className="me-2 size-4" />
        Transfer Batch
      </Button>
    </div>
  );
}

// Warehouse section with batch seats grid
function WarehouseSection({
  warehouseName,
  batches,
  totalWeight,
  totalBags,
  selectedBatchId,
  onSelectBatch,
}: {
  warehouseName: string;
  batches: BatchStock[];
  totalWeight: number;
  totalBags: number;
  selectedBatchId: number | null;
  onSelectBatch: (batch: BatchStock) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Warehouse header - like section label in flight */}
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
          <WarehouseIcon className="text-muted-foreground size-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">{warehouseName}</h2>
          <p className="text-muted-foreground text-xs">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''}
            {totalBags > 0 && ` • ${totalBags.toLocaleString()} bags`}
            {' • '}
            {formatQuantityCompact(totalWeight)}
          </p>
        </div>
      </div>

      {/* Batch seats grid - 3 columns like flight seats */}
      <div className="grid grid-cols-3 gap-2">
        {batches.map((batch) => (
          <BatchSeat
            key={batch.id}
            batch={batch}
            isSelected={selectedBatchId === batch.id}
            onSelect={() => onSelectBatch(batch)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BatchesPage() {
  const router = useRouter();
  const t = useTranslations('inventory');

  // State
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchStock | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

  // Fetch data
  const {data: batches, isLoading, error} = useBatchStock();

  // Extract unique warehouses with counts
  const warehouses = useMemo(() => {
    if (!batches) return [];
    const warehouseMap = new Map<
      number,
      {id: number; name: string; count: number}
    >();

    batches.forEach((batch) => {
      const existing = warehouseMap.get(batch.warehouse_id);
      if (existing) {
        existing.count += 1;
      } else {
        warehouseMap.set(batch.warehouse_id, {
          id: batch.warehouse_id,
          name: batch.warehouse_name,
          count: 1,
        });
      }
    });

    return Array.from(warehouseMap.values()).sort((a, b) => b.count - a.count);
  }, [batches]);

  // Extract unique product types with counts and colors
  const productTypes = useMemo(() => {
    if (!batches) return [];
    const productMap = new Map<
      string,
      {name: string; code: string; count: number; colorClass: string}
    >();

    batches.forEach((batch) => {
      const code =
        batch.product_type_code ||
        batch.product_type.toLowerCase().replace(/\s+/g, '_');
      const existing = productMap.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        const style = getProductTypeStyle(code);
        // Extract solid color for pill dot
        const colorClass = style.border.replace('border-', 'bg-');
        productMap.set(code, {
          name: batch.product_type,
          code,
          count: 1,
          colorClass,
        });
      }
    });

    return Array.from(productMap.values()).sort((a, b) => b.count - a.count);
  }, [batches]);

  // Filter batches by search, warehouse, and product type
  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    return batches.filter((batch) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          batch.batch_code.toLowerCase().includes(searchLower) ||
          batch.product_type.toLowerCase().includes(searchLower) ||
          batch.warehouse_name.toLowerCase().includes(searchLower) ||
          (batch.batch_name &&
            batch.batch_name.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Warehouse filter
      if (
        selectedWarehouse !== 'all' &&
        batch.warehouse_id !== parseInt(selectedWarehouse)
      ) {
        return false;
      }

      // Product type filter
      if (selectedProductType !== 'all') {
        const batchCode =
          batch.product_type_code ||
          batch.product_type.toLowerCase().replace(/\s+/g, '_');
        if (batchCode !== selectedProductType) return false;
      }

      return true;
    });
  }, [batches, search, selectedWarehouse, selectedProductType]);

  // Group batches by warehouse with totals
  const warehouseGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        batches: BatchStock[];
        totalWeight: number;
        totalBags: number;
      }
    >();

    filteredBatches.forEach((batch) => {
      const existing = groups.get(batch.warehouse_name);
      const bags =
        batch.can_be_packaged && batch.package_count ? batch.package_count : 0;

      if (existing) {
        existing.batches.push(batch);
        existing.totalWeight += batch.quantity;
        existing.totalBags += bags;
      } else {
        groups.set(batch.warehouse_name, {
          batches: [batch],
          totalWeight: batch.quantity,
          totalBags: bags,
        });
      }
    });

    return Array.from(groups.entries()).sort(
      (a, b) => b[1].batches.length - a[1].batches.length
    );
  }, [filteredBatches]);

  const totalCount = batches?.length || 0;
  const isEmpty = !batches || batches.length === 0;
  const noResults = filteredBatches.length === 0 && !isEmpty;

  const handleSelectBatch = (batch: BatchStock) => {
    setSelectedBatch(selectedBatch?.id === batch.id ? null : batch);
  };

  const handleTransfer = () => {
    if (selectedBatch) {
      router.push(`/batches/transfer?batch_id=${selectedBatch.id}`);
    }
  };

  return (
    <InventoryGuard>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-xs">
                  Tap a batch to see details
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/batches/transfer')}
            >
              <ArrowRightLeft className="me-2 size-4" />
              Transfer
            </Button>
          </div>
        </div>

        <div className="container mx-auto space-y-4 p-4">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder={t('search.placeholder') || 'Search batches...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Warehouse Filter Pills */}
          {!isLoading && !error && !isEmpty && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Warehouse
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <FilterPill
                  label="All"
                  count={totalCount}
                  isSelected={selectedWarehouse === 'all'}
                  onClick={() => setSelectedWarehouse('all')}
                />
                {warehouses.map((wh) => (
                  <FilterPill
                    key={wh.id}
                    label={wh.name}
                    count={wh.count}
                    isSelected={selectedWarehouse === String(wh.id)}
                    onClick={() => setSelectedWarehouse(String(wh.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product Type Filter Pills */}
          {!isLoading && !error && !isEmpty && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Product
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                <FilterPill
                  label="All"
                  isSelected={selectedProductType === 'all'}
                  onClick={() => setSelectedProductType('all')}
                />
                {productTypes.map((pt) => (
                  <FilterPill
                    key={pt.code}
                    label={pt.name}
                    count={pt.count}
                    isSelected={selectedProductType === pt.code}
                    onClick={() => setSelectedProductType(pt.code)}
                    colorClass={pt.colorClass}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected Batch Detail Panel */}
          {selectedBatch && (
            <BatchDetailPanel
              batch={selectedBatch}
              onClose={() => setSelectedBatch(null)}
              onTransfer={handleTransfer}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-12 w-48 rounded-lg" />
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, j) => (
                      <Skeleton key={j} className="h-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="text-destructive mb-4 size-12" />
                <p className="text-destructive mb-4 text-sm">
                  {t('error') || 'Failed to load batches'}
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
          {!isLoading && !error && isEmpty && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted mb-4 rounded-full p-4">
                  <Package className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t('empty.title') || 'No Batches Yet'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-[250px] text-center text-sm">
                  {t('empty.description') ||
                    'Batches will appear here once production outputs are recorded.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Search Results */}
          {noResults && (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="text-muted-foreground mb-3 size-8" />
              <p className="text-muted-foreground text-sm">No batches found</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSearch('')}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          )}

          {/* Warehouse Sections with Batch Seats */}
          {!isLoading && !error && !isEmpty && !noResults && (
            <div className="space-y-6">
              {warehouseGroups.map(
                ([
                  warehouseName,
                  {batches: warehouseBatches, totalWeight, totalBags},
                ]) => (
                  <WarehouseSection
                    key={warehouseName}
                    warehouseName={warehouseName}
                    batches={warehouseBatches}
                    totalWeight={totalWeight}
                    totalBags={totalBags}
                    selectedBatchId={selectedBatch?.id ?? null}
                    onSelectBatch={handleSelectBatch}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </InventoryGuard>
  );
}
