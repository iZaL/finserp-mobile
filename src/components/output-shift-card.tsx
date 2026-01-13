'use client';

import {useCallback} from 'react';
import {useRouter} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {Sun, Moon, Clock, ChevronRight, Wheat, Droplet} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {ProductionOutputRow} from '@/components/production-output-row';
import type {ProductionOutput, ProductionShift} from '@/types/production-output';

// Get shift icon based on shift name/code
function getShiftIcon(shift: ProductionShift) {
  const code = shift.code?.toLowerCase() || '';
  const name = shift.name?.toLowerCase() || '';

  if (
    code.includes('day') ||
    name.includes('day') ||
    (shift.start_time && shift.start_time >= '05:00' && shift.start_time <= '12:00')
  ) {
    return Sun;
  }
  if (code.includes('night') || name.includes('night')) {
    return Moon;
  }
  return Clock;
}

// Get shift styling
function getShiftStyle(shift: ProductionShift) {
  const code = shift.code?.toLowerCase() || '';
  const name = shift.name?.toLowerCase() || '';
  const isDay = code.includes('day') || name.includes('day') ||
    (shift.start_time && shift.start_time >= '05:00' && shift.start_time <= '12:00');
  const isNight = code.includes('night') || name.includes('night');

  if (isDay) {
    return {
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200/50 dark:border-amber-800/50',
    };
  }
  if (isNight) {
    return {
      bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200/50 dark:border-indigo-800/50',
    };
  }
  return {
    bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200/50 dark:border-slate-700/50',
  };
}

// Get product type styling
function getProductTypeStyle(typeName: string) {
  const isFishmeal = typeName.toLowerCase().includes('fishmeal');
  return {
    icon: isFishmeal ? Wheat : Droplet,
    textColor: isFishmeal
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-blue-600 dark:text-blue-400',
  };
}

interface ShiftData {
  shift: ProductionShift;
  byType: Record<string, {total: number; records: ProductionOutput[]}>;
  totalRecords: number;
  allRecords: ProductionOutput[];
}

interface OutputShiftCardProps {
  data: ShiftData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  canSelect: boolean;
  selectedIds: Set<number>;
  onToggleSelection: (id: number) => void;
  onToggleGroupSelection: () => void;
  isOutputSelectable: (output: ProductionOutput) => boolean;
  latestOutputId: number | null;
  productTypes: string[];
}

export function OutputShiftCard({
  data,
  isExpanded,
  onToggleExpand,
  canSelect,
  selectedIds,
  onToggleSelection,
  onToggleGroupSelection,
  isOutputSelectable,
  latestOutputId,
  productTypes,
}: OutputShiftCardProps) {
  const router = useRouter();
  const {shift, byType, totalRecords, allRecords} = data;

  const ShiftIcon = getShiftIcon(shift);
  const style = getShiftStyle(shift);

  // Selection state
  const selectableRecords = allRecords.filter(isOutputSelectable);
  const selectableCount = selectableRecords.length;
  const hasSelectable = selectableCount > 0;
  const isFullySelected = hasSelectable && selectableRecords.every((r) => selectedIds.has(r.id));
  const isPartiallySelected = hasSelectable &&
    selectableRecords.some((r) => selectedIds.has(r.id)) &&
    !isFullySelected;

  const handleCardClick = useCallback(() => {
    if (totalRecords > 1 || canSelect) {
      onToggleExpand();
    } else if (totalRecords === 1) {
      // Single record - navigate to detail
      router.push(`/production-outputs/${allRecords[0].id}`);
    }
  }, [totalRecords, canSelect, onToggleExpand, router, allRecords]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGroupSelection();
  }, [onToggleGroupSelection]);

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border transition-all',
      style.borderColor,
      isExpanded && 'ring-1 ring-inset ring-black/5 dark:ring-white/5'
    )}>
      {/* Shift Header */}
      <div
        className={cn(
          'flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors',
          `bg-gradient-to-r ${style.bgGradient}`,
          'hover:brightness-95 dark:hover:brightness-110'
        )}
        onClick={handleCardClick}
      >
        {/* Selection checkbox */}
        {canSelect && (
          <div onClick={handleCheckboxClick}>
            <Checkbox
              checked={isFullySelected}
              disabled={!hasSelectable}
              className={cn(
                'size-4',
                !hasSelectable && 'opacity-30',
                isPartiallySelected && 'data-[state=unchecked]:bg-primary/30'
              )}
            />
          </div>
        )}

        {/* Shift Icon */}
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
          <ShiftIcon className={cn('size-5', style.iconColor)} />
        </div>

        {/* Shift Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{shift.name}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {totalRecords} {totalRecords === 1 ? 'output' : 'outputs'}
            </Badge>
            {canSelect && selectableCount > 0 && selectableCount !== totalRecords && (
              <Badge variant="outline" className="px-1 py-0 text-[9px]">
                {selectableCount} avail
              </Badge>
            )}
          </div>

          {/* Product Type Totals */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {productTypes.map((type) => {
              const typeStyle = getProductTypeStyle(type);
              const TypeIcon = typeStyle.icon;
              const value = byType[type]?.total;
              if (!value) return null;

              return (
                <div key={type} className="flex items-center gap-1">
                  <TypeIcon className={cn('size-3', typeStyle.textColor)} />
                  <span className={cn('text-xs font-medium tabular-nums', typeStyle.textColor)}>
                    {value >= 1000
                      ? `${(value / 1000).toFixed(1)}T`
                      : `${value.toLocaleString()} kg`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expand indicator */}
        {totalRecords > 0 && (
          <ChevronRight
            className={cn(
              'text-muted-foreground size-5 shrink-0 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && totalRecords > 0 && (
        <div className="border-t bg-white/50 dark:bg-black/20">
          <div className="space-y-0.5 p-1.5">
            {Object.entries(byType).flatMap(([, typeData]) =>
              typeData.records.map((record) => {
                const selectable = isOutputSelectable(record);
                const isSelected = selectedIds.has(record.id);

                return (
                  <ProductionOutputRow
                    key={record.id}
                    output={record}
                    mode={canSelect ? 'select' : 'display'}
                    selected={isSelected}
                    onSelect={onToggleSelection}
                    isLatest={record.id === latestOutputId}
                    disabled={canSelect && !selectable}
                    showChevron={!canSelect}
                    onClick={() => {
                      if (canSelect && selectable) {
                        onToggleSelection(record.id);
                      } else if (!canSelect) {
                        router.push(`/production-outputs/${record.id}`);
                      }
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Empty shift card for dates with no outputs for a particular shift
interface OutputShiftEmptyProps {
  shift: ProductionShift;
  className?: string;
}

export function OutputShiftEmpty({shift, className}: OutputShiftEmptyProps) {
  const ShiftIcon = getShiftIcon(shift);
  const style = getShiftStyle(shift);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3',
        style.borderColor,
        'opacity-50',
        className
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
        <ShiftIcon className={cn('size-5', style.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-muted-foreground font-medium">{shift.name}</span>
        <p className="text-muted-foreground text-xs">No outputs</p>
      </div>
    </div>
  );
}
