'use client';

import {useMemo, useState, useCallback, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Package,
  Layers,
  Calendar,
  Wheat,
  Droplet,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {useProductionOutputs} from '@/hooks/use-production-outputs';
import {usePermissionStore} from '@/lib/stores/permission-store';
import type {
  ProductionOutput,
  ProductionOutputFilters,
  ProductionShift,
} from '@/types/production-output';
import {OutputShiftCard} from '@/components/output-shift-card';

interface ShiftGroupData {
  shift: ProductionShift;
  byType: Record<string, {total: number; records: ProductionOutput[]}>;
  totalRecords: number;
  allRecords: ProductionOutput[];
}

interface GroupedData {
  date: string;
  byShift: Record<number, ShiftGroupData>;
  byType: Record<string, {total: number; records: ProductionOutput[]}>; // For totals display
  totalRecords: number;
  allRecords: ProductionOutput[];
}

interface ProductionOutputsTableProps {
  filters?: ProductionOutputFilters;
  showBatchingCard?: boolean;
  showEmptyState?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  onlyBatchable?: boolean; // Only show outputs that can be used for batch creation
  defaultExpanded?: boolean; // Expand all date groups by default
}

// Get product type styling
function getProductTypeStyle(typeName: string) {
  const isFishmeal = typeName.toLowerCase().includes('fishmeal');
  return {
    icon: isFishmeal ? Wheat : Droplet,
    gradient: isFishmeal
      ? 'from-amber-500 to-orange-600'
      : 'from-blue-500 to-cyan-600',
    textColor: isFishmeal
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-blue-600 dark:text-blue-400',
    bgColor: isFishmeal
      ? 'bg-amber-50 dark:bg-amber-950/30'
      : 'bg-blue-50 dark:bg-blue-950/30',
  };
}

export function ProductionOutputsTable({
  filters = {},
  showBatchingCard = true,
  showEmptyState = true,
  compact = false,
  title,
  subtitle,
  onlyBatchable = false,
  defaultExpanded = false,
}: ProductionOutputsTableProps) {
  const router = useRouter();
  const t = useTranslations('productionOutputs');
  // Track expanded shifts by key: `${date}-${shiftId}`
  const [expandedShifts, setExpandedShifts] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const {data, isLoading, error} = useProductionOutputs(filters);
  const {canCreateBatch: hasCreateBatchPermission} = usePermissionStore();
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  const {productTypes, groupedByDate, totals, allOutputs, latestOutputId, allShifts} =
    useMemo(() => {
      if (!data?.data?.length)
        return {
          productTypes: [],
          groupedByDate: [] as GroupedData[],
          totals: {},
          allOutputs: [] as ProductionOutput[],
          latestOutputId: null as number | null,
          allShifts: [] as ProductionShift[],
        };

      // Filter to only batchable outputs if requested
      const filteredData = onlyBatchable
        ? data.data.filter(
            (o) =>
              (o.available_quantity ?? o.total_quantity) > 0 &&
              o.status !== 'voided' &&
              o.status !== 'verified'
          )
        : data.data;

      if (filteredData.length === 0)
        return {
          productTypes: [],
          groupedByDate: [] as GroupedData[],
          totals: {},
          allOutputs: [] as ProductionOutput[],
          latestOutputId: null as number | null,
          allShifts: [] as ProductionShift[],
        };

      const types = [
        ...new Set(
          filteredData.map((o) => o.product_type?.name).filter(Boolean)
        ),
      ] as string[];

      // Collect all unique shifts
      const shiftsMap = new Map<number, ProductionShift>();
      filteredData.forEach((output) => {
        if (output.shift) {
          shiftsMap.set(output.shift.id, output.shift);
        }
      });
      const shifts = Array.from(shiftsMap.values()).sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );

      // Group by date, then by shift, then by product type
      const byDate: Record<
        string,
        {
          byShift: Record<number, {
            shift: ProductionShift;
            byType: Record<string, {total: number; records: ProductionOutput[]}>;
          }>;
          byType: Record<string, {total: number; records: ProductionOutput[]}>;
        }
      > = {};
      const totalsByType: Record<string, number> = {};

      // Find the latest output (most recently created)
      const latestOutput = filteredData.reduce(
        (latest, current) => {
          if (!latest) return current;
          return new Date(current.created_at) > new Date(latest.created_at)
            ? current
            : latest;
        },
        null as ProductionOutput | null
      );

      filteredData.forEach((output) => {
        const date = output.production_date;
        const typeName = output.product_type?.name || 'Other';
        const shiftId = output.shift_id || 0;
        const shift = output.shift || {id: 0, name: 'Unknown', code: 'unknown', is_active: true, display_order: 999};

        // Initialize date group
        if (!byDate[date]) {
          byDate[date] = {byShift: {}, byType: {}};
        }

        // Initialize shift group within date
        if (!byDate[date].byShift[shiftId]) {
          byDate[date].byShift[shiftId] = {shift, byType: {}};
        }

        // Initialize type group within shift
        if (!byDate[date].byShift[shiftId].byType[typeName]) {
          byDate[date].byShift[shiftId].byType[typeName] = {total: 0, records: []};
        }

        // Initialize type group within date (for date-level totals)
        if (!byDate[date].byType[typeName]) {
          byDate[date].byType[typeName] = {total: 0, records: []};
        }

        // Add output to shift-level group
        byDate[date].byShift[shiftId].byType[typeName].total += output.total_quantity;
        byDate[date].byShift[shiftId].byType[typeName].records.push(output);

        // Add to date-level group for totals
        byDate[date].byType[typeName].total += output.total_quantity;
        byDate[date].byType[typeName].records.push(output);

        // Global totals
        totalsByType[typeName] = (totalsByType[typeName] || 0) + output.total_quantity;
      });

      // Sort records within each group by created_at descending (newest first)
      Object.values(byDate).forEach((dateGroup) => {
        // Sort within shift groups
        Object.values(dateGroup.byShift).forEach((shiftGroup) => {
          Object.values(shiftGroup.byType).forEach((typeGroup) => {
            typeGroup.records.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          });
        });
        // Sort date-level type groups
        Object.values(dateGroup.byType).forEach((typeGroup) => {
          typeGroup.records.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });
      });

      const grouped: GroupedData[] = Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, {byShift, byType}]) => {
          // Build shift groups with proper structure
          const shiftGroups: Record<number, ShiftGroupData> = {};
          Object.entries(byShift).forEach(([shiftIdStr, shiftData]) => {
            const shiftId = parseInt(shiftIdStr);
            const allShiftRecords = Object.values(shiftData.byType)
              .flatMap((t) => t.records)
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
            shiftGroups[shiftId] = {
              shift: shiftData.shift,
              byType: shiftData.byType,
              totalRecords: allShiftRecords.length,
              allRecords: allShiftRecords,
            };
          });

          const allRecords = Object.values(byType)
            .flatMap((t) => t.records)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

          return {
            date,
            byShift: shiftGroups,
            byType,
            totalRecords: allRecords.length,
            allRecords,
          };
        });

      return {
        productTypes: types,
        groupedByDate: grouped,
        totals: totalsByType,
        allOutputs: filteredData,
        latestOutputId: latestOutput?.id ?? null,
        allShifts: shifts,
      };
    }, [data?.data, onlyBatchable]);

  const selectableOutputs = useMemo(() => {
    return allOutputs.filter(
      (o) =>
        (o.available_quantity ?? o.total_quantity) > 0 &&
        o.status !== 'voided' &&
        o.status !== 'verified'
    );
  }, [allOutputs]);

  const selectedOutputs = useMemo(() => {
    return allOutputs.filter((o) => selectedIds.has(o.id));
  }, [allOutputs, selectedIds]);

  const selectedProductTypes = useMemo(() => {
    return [
      ...new Set(selectedOutputs.map((o) => o.production_product_type_id)),
    ];
  }, [selectedOutputs]);

  const canCreateBatch =
    selectedOutputs.length > 0 && selectedProductTypes.length === 1;
  const mixedProductTypes = selectedProductTypes.length > 1;

  // Selection is always enabled when batching is available
  const canSelect =
    showBatchingCard &&
    selectableOutputs.length > 0 &&
    hasCreateBatchPermission();

  // Auto-expand all shifts when defaultExpanded is true (only once on initial load)
  // Note: defaultExpanded=false means collapsed by default (summary view)
  useEffect(() => {
    if (defaultExpanded && groupedByDate.length > 0 && !hasAutoExpanded) {
      const allShiftKeys = new Set<string>();
      groupedByDate.forEach((group) => {
        Object.keys(group.byShift).forEach((shiftId) => {
          allShiftKeys.add(`${group.date}-${shiftId}`);
        });
      });
      setExpandedShifts(allShiftKeys);
      setHasAutoExpanded(true);
    }
  }, [defaultExpanded, groupedByDate, hasAutoExpanded]);

  const toggleShift = useCallback((date: string, shiftId: number) => {
    const key = `${date}-${shiftId}`;
    setExpandedShifts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreateBatch = useCallback(() => {
    if (!canCreateBatch) return;
    const ids = [...selectedIds].join(',');
    router.push(`/batches/new?output_ids=${ids}`);
  }, [canCreateBatch, selectedIds, router]);

  const isOutputSelectable = useCallback((output: ProductionOutput) => {
    return (
      (output.available_quantity ?? output.total_quantity) > 0 &&
      output.status !== 'voided' &&
      output.status !== 'verified'
    );
  }, []);

  const getSelectableForShiftGroup = useCallback(
    (shiftGroup: ShiftGroupData) => {
      return shiftGroup.allRecords.filter(isOutputSelectable);
    },
    [isOutputSelectable]
  );

  const toggleShiftGroupSelection = useCallback(
    (shiftGroup: ShiftGroupData) => {
      const selectableRecords = getSelectableForShiftGroup(shiftGroup);
      if (selectableRecords.length === 0) return;

      const selectableIds = selectableRecords.map((r) => r.id);
      const allSelected = selectableIds.every((id) => selectedIds.has(id));

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          selectableIds.forEach((id) => next.delete(id));
        } else {
          selectableIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [getSelectableForShiftGroup, selectedIds]
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="space-y-1 p-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4 text-sm">{t('failedToLoad')}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!isLoading && !error && data?.data.length === 0) {
    if (!showEmptyState) return null;

    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted mb-4 rounded-full p-4">
            <Package className="text-muted-foreground size-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t('empty.title')}</h3>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            {t('empty.description')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Has data
  if (!data || data.data.length === 0) return null;

  // Get short product type name for totals display
  const getShortTypeName = (name: string) => {
    if (name.toLowerCase().includes('fishmeal')) return 'Fishmeal';
    if (name.toLowerCase().includes('fish oil')) return 'Fish Oil';
    return name.length > 10 ? name.slice(0, 8) + '...' : name;
  };

  return (
    <div className="space-y-4">
      {/* Optional header */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              {title && (
                <h2
                  className={cn(
                    'font-semibold',
                    compact ? 'text-base' : 'text-lg'
                  )}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-muted-foreground text-sm">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Groups with Shift Cards */}
      <div className="space-y-6">
        {groupedByDate.map((group) => {
          // Sort shifts by display_order
          const sortedShifts = Object.values(group.byShift).sort(
            (a, b) => (a.shift.display_order ?? 0) - (b.shift.display_order ?? 0)
          );

          return (
            <div key={group.date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-3 px-1">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                  )}
                >
                  <Calendar className="text-muted-foreground size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold">
                      {formatDate(group.date)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatShortDate(group.date)}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{t('list.records', {count: group.totalRecords})}</span>
                    <span>•</span>
                    <span>{Object.keys(group.byShift).length} {Object.keys(group.byShift).length === 1 ? 'shift' : 'shifts'}</span>
                  </div>
                </div>
                {/* Date-level totals */}
                <div className="flex items-center gap-3">
                  {productTypes.map((type) => {
                    const style = getProductTypeStyle(type);
                    const value = group.byType[type]?.total;
                    if (!value) return null;
                    return (
                      <div key={type} className="text-right">
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            style.textColor
                          )}
                        >
                          {value >= 1000
                            ? `${(value / 1000).toFixed(1)}T`
                            : `${value.toLocaleString()} kg`}
                        </span>
                        <div className="text-muted-foreground text-[9px]">
                          {getShortTypeName(type)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift Cards */}
              <div className="space-y-2 pl-1">
                {sortedShifts.map((shiftData) => {
                  const shiftKey = `${group.date}-${shiftData.shift.id}`;
                  const isExpanded = expandedShifts.has(shiftKey);

                  return (
                    <OutputShiftCard
                      key={shiftKey}
                      data={shiftData}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleShift(group.date, shiftData.shift.id)}
                      canSelect={canSelect}
                      selectedIds={selectedIds}
                      onToggleSelection={toggleSelection}
                      onToggleGroupSelection={() => toggleShiftGroupSelection(shiftData)}
                      isOutputSelectable={isOutputSelectable}
                      latestOutputId={latestOutputId}
                      productTypes={productTypes}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer totals */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl px-4 py-3 dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{t('list.total')}</span>
          <div className="flex items-center gap-4">
            {productTypes.map((type) => {
              const style = getProductTypeStyle(type);
              const value = totals[type];
              if (!value) return null;
              return (
                <div key={type} className="text-right">
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      style.textColor
                    )}
                  >
                    {value >= 1000
                      ? `${(value / 1000).toFixed(1)} TON`
                      : `${value.toLocaleString()} kg`}
                  </span>
                  <div className="text-muted-foreground text-[9px]">
                    {getShortTypeName(type)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selection mode footer */}
      {canSelect && (
        <div className="bg-background/95 fixed right-0 bottom-16 left-0 z-50 border-t px-3 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="font-semibold">
                {selectedIds.size} output{selectedIds.size !== 1 ? 's' : ''}{' '}
                selected
              </div>
              {mixedProductTypes && (
                <p className="text-destructive text-xs">
                  Mixed product types - select same type only
                </p>
              )}
            </div>
            <Button
              onClick={handleCreateBatch}
              disabled={!canCreateBatch}
              className="bg-gradient-to-r from-indigo-500 to-violet-600"
            >
              <Layers className="me-2 size-4" />
              {t('createBatch')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
