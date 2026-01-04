'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {format, parseISO} from 'date-fns';
import {
  ArrowLeft,
  Activity,
  ArrowRightLeft,
  Plus,
  Minus,
  Package,
  Factory,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {Badge} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {useBatchMovements, useBatchWarehouses} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import {TransferDialog} from '@/components/inventory/transfer-dialog';
import type {BatchMovement, BatchMovementFilters} from '@/types/inventory';

export default function MovementsPage() {
  const router = useRouter();
  const t = useTranslations('inventory.movements');

  // Filters state
  const [filters, setFilters] = useState<BatchMovementFilters>({
    per_page: 50,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | undefined>();

  // Queries
  const {data: warehouses} = useBatchWarehouses();
  const {
    data: movementsData,
    isLoading,
    error,
    refetch,
  } = useBatchMovements(filters);

  const handleTransferBatch = (batchId: number) => {
    setTransferBatchId(batchId);
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    refetch();
  };

  const movements = movementsData?.data || [];
  const meta = movementsData?.meta;

  // Load more
  const loadMore = () => {
    if (meta && meta.current_page < meta.last_page) {
      setFilters((prev) => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({per_page: 50});
  };

  return (
    <InventoryGuard>
      <div className="container mx-auto p-4 pb-20">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/batches')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mb-4 w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="size-4" />
                {t('filters')}
              </span>
              {showFilters ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-4 space-y-3">
            <Card>
              <CardContent className="space-y-4 p-4">
                {/* Warehouse Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('filterWarehouse')}
                  </label>
                  <Select
                    value={filters.warehouse_id?.toString() || 'all'}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        warehouse_id:
                          value === 'all' ? undefined : parseInt(value),
                        page: 1,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('allWarehouses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allWarehouses')}</SelectItem>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id.toString()}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  {t('clearFilters')}
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive mb-4 text-sm">{t('loadError')}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                {t('retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Movements List */}
        {!isLoading && !error && movements.length > 0 && (
          <div className="space-y-3">
            {movements.map((movement) => (
              <MovementCard
                key={movement.id}
                movement={movement}
                onTransfer={handleTransferBatch}
              />
            ))}

            {/* Load More */}
            {meta && meta.current_page < meta.last_page && (
              <Button variant="outline" className="w-full" onClick={loadMore}>
                {t('loadMore')}
              </Button>
            )}

            {/* Results Count */}
            {meta && (
              <p className="text-muted-foreground text-center text-sm">
                {t('showing')} {movements.length} {t('of')} {meta.total}{' '}
                {t('movements')}
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && movements.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="text-muted-foreground mb-4 size-12" />
              <h3 className="mb-2 text-lg font-semibold">{t('empty')}</h3>
              <p className="text-muted-foreground text-center text-sm">
                {t('emptyDescription')}
              </p>
            </CardContent>
          </Card>
        )}

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

// Movement Card Component
function MovementCard({
  movement,
  onTransfer,
}: {
  movement: BatchMovement;
  onTransfer: (batchId: number) => void;
}) {
  const t = useTranslations('inventory.movements');
  const tInventory = useTranslations('inventory');

  const getTypeIcon = () => {
    switch (movement.type) {
      case 'transfer_in':
      case 'transfer_out':
        return <ArrowRightLeft className="size-4" />;
      case 'production':
        return <Factory className="size-4" />;
      case 'adjustment':
        return movement.adjustment_type === 'addition' ? (
          <Plus className="size-4" />
        ) : (
          <Minus className="size-4" />
        );
      default:
        return <Package className="size-4" />;
    }
  };

  const getTypeBadge = () => {
    switch (movement.type) {
      case 'transfer_in':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {t('types.transfer_in')}
          </Badge>
        );
      case 'transfer_out':
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          >
            {t('types.transfer_out')}
          </Badge>
        );
      case 'production':
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          >
            {t('types.production')}
          </Badge>
        );
      case 'adjustment':
        return movement.adjustment_type === 'addition' ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            {t('types.addition')}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          >
            {t('types.subtraction')}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{movement.type}</Badge>;
    }
  };

  const formattedDate = movement.date
    ? format(parseISO(movement.date), 'MMM d, yyyy h:mm a')
    : '';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="bg-muted flex size-10 items-center justify-center rounded-full">
            {getTypeIcon()}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{movement.batch_code}</p>
                <p className="text-muted-foreground text-sm">
                  {movement.product_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getTypeBadge()}
                {movement.batch_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => onTransfer(movement.batch_id!)}
                    title={tInventory('transferLabel')}
                  >
                    <ArrowRightLeft className="text-muted-foreground size-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="text-muted-foreground mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">
                  {movement.adjustment_type === 'addition' ? '+' : '-'}
                  {movement.quantity.toLocaleString()}
                </span>{' '}
                @ {movement.warehouse_name}
              </p>
              {movement.reason && (
                <p>
                  {t('reason')}: {movement.reason}
                </p>
              )}
              {movement.notes && (
                <p className="text-muted-foreground/70 italic">
                  {movement.notes}
                </p>
              )}
              <p className="text-muted-foreground/60 text-xs">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
