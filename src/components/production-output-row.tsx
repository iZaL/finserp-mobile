'use client';

import {
  Wheat,
  Droplet,
  ChevronRight,
  Warehouse,
  CheckCircle2,
  CircleDot,
  Package,
} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import type {ProductionOutput} from '@/types/production-output';

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

export interface OutputAllocation {
  bags: number;
  quantity: number;
}

export interface ProductionOutputRowProps {
  output: ProductionOutput;
  mode: 'display' | 'select' | 'allocate';
  selected?: boolean;
  onSelect?: (id: number) => void;
  allocation?: OutputAllocation;
  onAllocationChange?: (id: number, bags: number) => void;
  showWarehouse?: boolean;
  showChevron?: boolean;
  isLatest?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function ProductionOutputRow({
  output,
  mode,
  selected = false,
  onSelect,
  allocation,
  onAllocationChange,
  showWarehouse = false,
  showChevron = true,
  isLatest = false,
  disabled = false,
  onClick,
}: ProductionOutputRowProps) {
  const typeName = output.product_type?.name || 'Unknown';
  const style = getProductTypeStyle(typeName);
  const Icon = style.icon;

  const isPackaged =
    output.storage_type === 'packaged' && (output.package_count ?? 0) > 0;
  const weightPerBag = output.weight_per_package || 50;
  const totalBags = output.package_count || 0;

  // Calculate available bags from available_quantity
  // Use round() instead of floor() to avoid floating point precision issues
  const availableQty = output.available_quantity ?? output.total_quantity;
  const availableBags = Math.round(availableQty / weightPerBag);

  const time = new Date(output.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine availability status
  const isFullyBatched = availableQty === 0;
  const isPartiallyBatched =
    availableQty > 0 && availableQty < output.total_quantity;

  const handleAllocationChange = (value: string) => {
    if (!onAllocationChange) return;
    const bags = Math.min(Math.max(0, parseInt(value) || 0), availableBags);
    onAllocationChange(output.id, bags);
  };

  // Render status icon - compact
  const StatusIcon = () => {
    if (isFullyBatched) {
      return <Package className="text-muted-foreground size-4 shrink-0" />;
    }
    if (isPartiallyBatched) {
      return <CircleDot className="size-4 shrink-0 text-amber-500" />;
    }
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-2 transition-colors',
        onClick && 'hover:bg-muted/50 cursor-pointer',
        mode === 'select' && selected && 'bg-primary/5 ring-primary/20 ring-1',
        mode === 'allocate' && 'bg-muted/30',
        disabled && 'opacity-50'
      )}
      onClick={onClick}
    >
      {/* Selection checkbox */}
      {mode === 'select' && onSelect && (
        <Checkbox
          checked={selected}
          disabled={disabled}
          className={cn('size-4 shrink-0', disabled && 'opacity-30')}
          onCheckedChange={() => onSelect(output.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Product type icon */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          style.bgColor
        )}
      >
        <Icon className={cn('size-4', style.textColor)} />
      </div>

      {/* Content - compact two-row layout */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* Top row: Product name + Latest badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'truncate text-sm font-medium',
              disabled && 'text-muted-foreground'
            )}
          >
            {typeName}
          </span>
          {isLatest && (
            <Badge className="shrink-0 bg-emerald-500 px-1 py-0 text-[9px] text-white">
              New
            </Badge>
          )}
        </div>

        {/* Bottom row: Time/metadata */}
        <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px]">
          <span className="shrink-0 tabular-nums">{time}</span>
          {output.production_run && (
            <>
              <span className="shrink-0">•</span>
              <span className="truncate">{output.production_run.name}</span>
            </>
          )}
          {showWarehouse && output.warehouse && (
            <>
              <span className="shrink-0">•</span>
              <Warehouse className="size-3 shrink-0" />
              <span className="truncate">{output.warehouse.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Quantity + Status icon */}
      {mode === 'allocate' && isPackaged ? (
        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="number"
            min={0}
            max={availableBags}
            value={allocation?.bags ?? 0}
            onChange={(e) => handleAllocationChange(e.target.value)}
            className="h-6 w-14 text-center text-xs"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-muted-foreground text-[10px]">
            /{availableBags}
          </span>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="text-right">
            <span
              className={cn(
                'block text-sm font-semibold tabular-nums',
                style.textColor,
                disabled && 'opacity-50'
              )}
            >
              {isPackaged
                ? isPartiallyBatched
                  ? `${availableBags}/${totalBags} bags`
                  : `${totalBags}×${weightPerBag}kg bags`
                : `${output.total_quantity.toLocaleString()} ${output.unit}`}
            </span>
            <span className="text-muted-foreground block text-[10px] tabular-nums">
              {isPackaged
                ? `${(isPartiallyBatched ? availableQty : output.total_quantity).toLocaleString()} kg`
                : ''}
            </span>
          </div>
          <StatusIcon />
        </div>
      )}

      {showChevron && (
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      )}
    </div>
  );
}
