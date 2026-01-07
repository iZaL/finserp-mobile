'use client';

import {Fragment, useMemo, useState, useCallback, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Package,
  ChevronRight,
  Layers,
  Calendar,
  Wheat,
  Droplet,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {Checkbox} from '@/components/ui/checkbox';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {useProductionOutputs} from '@/hooks/use-production-outputs';
import {usePermissionStore} from '@/lib/stores/permission-store';
import {ProductionOutputRow} from '@/components/production-output-row';
import type {
  ProductionOutput,
  ProductionOutputFilters,
} from '@/types/production-output';

interface GroupedData {
  date: string;
  byType: Record<string, {total: number; records: ProductionOutput[]}>;
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
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const {data, isLoading, error} = useProductionOutputs(filters);
  const {canCreateBatch: hasCreateBatchPermission} = usePermissionStore();
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  const {productTypes, groupedByDate, totals, allOutputs, latestOutputId} =
    useMemo(() => {
      if (!data?.data?.length)
        return {
          productTypes: [],
          groupedByDate: [] as GroupedData[],
          totals: {},
          allOutputs: [] as ProductionOutput[],
          latestOutputId: null as number | null,
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
        };

      const types = [
        ...new Set(
          filteredData.map((o) => o.product_type?.name).filter(Boolean)
        ),
      ] as string[];
      const byDate: Record<
        string,
        Record<string, {total: number; records: ProductionOutput[]}>
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

        if (!byDate[date]) byDate[date] = {};
        if (!byDate[date][typeName])
          byDate[date][typeName] = {total: 0, records: []};

        byDate[date][typeName].total += output.total_quantity;
        byDate[date][typeName].records.push(output);
        totalsByType[typeName] =
          (totalsByType[typeName] || 0) + output.total_quantity;
      });

      // Sort records within each type group by created_at descending (newest first)
      Object.values(byDate).forEach((dateGroup) => {
        Object.values(dateGroup).forEach((typeGroup) => {
          typeGroup.records.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        });
      });

      const grouped: GroupedData[] = Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, byType]) => {
          const allRecords = Object.values(byType)
            .flatMap((t) => t.records)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          return {
            date,
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

  // Auto-expand all dates when defaultExpanded is true (only once on initial load)
  useEffect(() => {
    if (defaultExpanded && groupedByDate.length > 0 && !hasAutoExpanded) {
      setExpandedDates(new Set(groupedByDate.map((g) => g.date)));
      setHasAutoExpanded(true);
    }
  }, [defaultExpanded, groupedByDate, hasAutoExpanded]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

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

  const getSelectableForGroup = useCallback(
    (group: GroupedData) => {
      return group.allRecords.filter(isOutputSelectable);
    },
    [isOutputSelectable]
  );

  const toggleGroupSelection = useCallback(
    (group: GroupedData) => {
      const selectableRecords = getSelectableForGroup(group);
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
    [getSelectableForGroup, selectedIds]
  );

  const isGroupFullySelected = useCallback(
    (group: GroupedData) => {
      const selectableRecords = getSelectableForGroup(group);
      if (selectableRecords.length === 0) return false;
      return selectableRecords.every((r) => selectedIds.has(r.id));
    },
    [getSelectableForGroup, selectedIds]
  );

  const isGroupPartiallySelected = useCallback(
    (group: GroupedData) => {
      const selectableRecords = getSelectableForGroup(group);
      if (selectableRecords.length === 0) return false;
      const selectedCount = selectableRecords.filter((r) =>
        selectedIds.has(r.id)
      ).length;
      return selectedCount > 0 && selectedCount < selectableRecords.length;
    },
    [getSelectableForGroup, selectedIds]
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

  // Get short product type name for column headers
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

      {/* Records List */}
      <div className="bg-background overflow-hidden">
        {/* Column headers - only show if we have product types */}
        {productTypes.length > 0 && (
          <div className="bg-muted/50 flex items-center border-b px-2 py-1.5">
            {canSelect && <div className="mr-2 w-4" />}
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                Date
              </span>
            </div>
            {productTypes.map((type) => {
              const style = getProductTypeStyle(type);
              return (
                <div key={type} className="w-16 shrink-0 text-right">
                  <span
                    className={cn(
                      'text-[10px] font-medium uppercase tracking-wide',
                      style.textColor
                    )}
                  >
                    {getShortTypeName(type)}
                  </span>
                </div>
              );
            })}
            <div className="w-4" />
          </div>
        )}

        {/* Rows */}
        <div className="divide-y">
          {groupedByDate.map((group) => {
            const isExpanded = expandedDates.has(group.date);
            const hasMultiple = group.totalRecords > 1;
            const singleRecord = !hasMultiple
              ? Object.values(group.byType)[0]?.records[0]
              : null;
            const selectableCount = getSelectableForGroup(group).length;
            const hasSelectable = selectableCount > 0;
            const isFullySelected = isGroupFullySelected(group);
            const isPartiallySelected = isGroupPartiallySelected(group);

            const handleRowClick = () => {
              if (canSelect) {
                if (hasMultiple) {
                  toggleDate(group.date);
                } else if (singleRecord && isOutputSelectable(singleRecord)) {
                  toggleSelection(singleRecord.id);
                }
              } else {
                if (hasMultiple) {
                  toggleDate(group.date);
                } else if (singleRecord) {
                  router.push(`/production-outputs/${singleRecord.id}`);
                }
              }
            };

            return (
              <Fragment key={group.date}>
                <div
                  className={cn(
                    'group flex cursor-pointer items-center gap-2 px-2 py-2.5 transition-colors',
                    'hover:bg-muted/50',
                    canSelect && isFullySelected && 'bg-primary/5'
                  )}
                  onClick={handleRowClick}
                >
                  {/* Selection checkbox */}
                  {canSelect && (
                    <div
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isFullySelected}
                        disabled={!hasSelectable}
                        className={cn(
                          'size-4',
                          !hasSelectable && 'opacity-30',
                          isPartiallySelected &&
                            'data-[state=unchecked]:bg-primary/30'
                        )}
                        onCheckedChange={() => {
                          if (hasMultiple) {
                            toggleGroupSelection(group);
                          } else if (singleRecord) {
                            toggleSelection(singleRecord.id);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Date icon */}
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg',
                      'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                    )}
                  >
                    <Calendar className="text-muted-foreground size-4" />
                  </div>

                  {/* Date info - takes remaining space */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold">
                        {formatDate(group.date)}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {formatShortDate(group.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasMultiple ? (
                        <>
                          <span className="text-muted-foreground text-xs">
                            {t('list.records', {count: group.totalRecords})}
                          </span>
                          {canSelect && selectableCount > 0 && (
                            <Badge
                              variant="outline"
                              className="px-1 py-0 text-[9px]"
                            >
                              {selectableCount} avail
                            </Badge>
                          )}
                        </>
                      ) : singleRecord ? (
                        <>
                          <span className="text-muted-foreground truncate text-xs">
                            {singleRecord.product_type?.name}
                          </span>
                          {singleRecord.available_quantity !== undefined &&
                          singleRecord.available_quantity === 0 ? (
                            <Package className="text-muted-foreground size-3.5 shrink-0" />
                          ) : singleRecord.available_quantity !== undefined &&
                            singleRecord.available_quantity <
                              singleRecord.total_quantity ? (
                            <CircleDot className="size-3.5 shrink-0 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Product type quantities - compact */}
                  {productTypes.map((type) => {
                    const style = getProductTypeStyle(type);
                    const value = group.byType[type]?.total;
                    return (
                      <div key={type} className="w-16 shrink-0 text-right">
                        {value ? (
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              style.textColor
                            )}
                          >
                            {value >= 1000
                              ? `${(value / 1000).toFixed(1)} TON`
                              : `${value.toLocaleString()} kg`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">
                            —
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Expand indicator */}
                  <div className="w-4 shrink-0">
                    {hasMultiple && (
                      <ChevronRight
                        className={cn(
                          'text-muted-foreground size-4 transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="bg-muted/20 border-muted border-t">
                    <div className="space-y-0.5 px-1 py-1">
                      {Object.entries(group.byType).flatMap(([, typeData]) =>
                        typeData.records.map((record) => {
                          const selectable = isOutputSelectable(record);
                          const isSelected = selectedIds.has(record.id);

                          return (
                            <ProductionOutputRow
                              key={record.id}
                              output={record}
                              mode={canSelect ? 'select' : 'display'}
                              selected={isSelected}
                              onSelect={toggleSelection}
                              isLatest={record.id === latestOutputId}
                              disabled={canSelect && !selectable}
                              onClick={() => {
                                if (canSelect && selectable) {
                                  toggleSelection(record.id);
                                } else if (!canSelect) {
                                  router.push(
                                    `/production-outputs/${record.id}`
                                  );
                                }
                              }}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        {/* Footer totals */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-2 py-2 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center gap-2">
            {canSelect && <div className="w-4 shrink-0" />}
            <div className="size-9 shrink-0" />
            <span className="min-w-0 flex-1 text-sm font-bold">
              {t('list.total')}
            </span>
            {productTypes.map((type) => {
              const style = getProductTypeStyle(type);
              const value = totals[type];
              return (
                <div key={type} className="w-16 shrink-0 text-right">
                  {value ? (
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
                  ) : (
                    <span className="text-muted-foreground/30 text-sm">—</span>
                  )}
                </div>
              );
            })}
            <div className="w-4 shrink-0" />
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
