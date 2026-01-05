'use client';

import {useState, useMemo, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {ArrowRightLeft, Loader2, Package, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
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
  useBatchStock,
  useBatchWarehouses,
  useBatchTransfer,
} from '@/hooks/use-inventory';
import type {BatchTransferRequest, BatchStock} from '@/types/inventory';

export interface TransferFormProps {
  initialBatchId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  fullHeight?: boolean;
  renderActions?: (props: {
    onSubmit: () => void;
    isSubmitting: boolean;
    isValid: boolean;
  }) => React.ReactNode;
}

export function TransferForm({
  initialBatchId,
  onSuccess,
  onCancel,
  showCancelButton = false,
  fullHeight = false,
  renderActions,
}: TransferFormProps) {
  const t = useTranslations('inventory.transfer');
  const tCommon = useTranslations('common');

  // State
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | null>(
    null
  );
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<
    number | null
  >(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(
    initialBatchId ?? null
  );
  const [batchSearch, setBatchSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [transferBags, setTransferBags] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries
  const {data: warehouses, isLoading: warehousesLoading} = useBatchWarehouses();
  const {data: allBatches, isLoading: allBatchesLoading} = useBatchStock();
  const batchTransfer = useBatchTransfer();

  // Filter batches by search term
  const filteredBatches = useMemo(() => {
    if (!allBatches) return [];
    if (!batchSearch) return allBatches;
    const searchLower = batchSearch.toLowerCase();
    return allBatches.filter(
      (b) =>
        b.batch_code.toLowerCase().includes(searchLower) ||
        b.product_type.toLowerCase().includes(searchLower) ||
        b.warehouse_name.toLowerCase().includes(searchLower)
    );
  }, [allBatches, batchSearch]);

  // Initialize from initialBatchId
  useEffect(() => {
    if (initialBatchId && allBatches) {
      const batch = allBatches.find((b) => b.id === initialBatchId);
      if (batch) {
        setSourceWarehouseId(batch.warehouse_id);
        setSelectedBatchId(batch.id);
      }
    }
  }, [initialBatchId, allBatches]);

  // Get selected batch
  const selectedBatch = useMemo(() => {
    if (!selectedBatchId) return null;
    return allBatches?.find((b) => b.id === selectedBatchId) || null;
  }, [selectedBatchId, allBatches]);

  // Handle batch selection - auto-populate source warehouse
  const handleBatchSelect = (batch: BatchStock) => {
    setSelectedBatchId(batch.id);
    setSourceWarehouseId(batch.warehouse_id);
    setTransferBags(0);
    setQuantity(0);
    setErrors((prev) => ({...prev, batch: ''}));
  };

  // Available stock for selected batch
  const availableStock = selectedBatch?.quantity ?? 0;
  const unit = selectedBatch?.unit ?? 'kg';

  // Package info for bag-based transfer
  const canBePackaged = selectedBatch?.can_be_packaged ?? false;
  const packageCount = selectedBatch?.package_count ?? 0;
  const weightPerPackage = selectedBatch?.weight_per_package ?? 50;
  const packageTypeName = selectedBatch?.package_type_name ?? 'bags';

  // Calculate quantity from bags when in bag mode
  const calculatedQuantityFromBags = transferBags * weightPerPackage;

  // Effective quantity (either from bags or direct input)
  const effectiveQuantity = canBePackaged
    ? calculatedQuantityFromBags
    : quantity;

  // Check if form is valid (without setting errors)
  const isFormValid =
    !!selectedBatchId &&
    !!destinationWarehouseId &&
    sourceWarehouseId !== destinationWarehouseId &&
    effectiveQuantity > 0 &&
    effectiveQuantity <= availableStock;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedBatchId) {
      newErrors.batch =
        t('validation.batchRequired') || 'Please select a batch';
    }
    if (!destinationWarehouseId) {
      newErrors.destinationWarehouse = t(
        'validation.destinationWarehouseRequired'
      );
    }
    if (
      sourceWarehouseId &&
      destinationWarehouseId &&
      sourceWarehouseId === destinationWarehouseId
    ) {
      newErrors.destinationWarehouse = t('validation.sameWarehouse');
    }
    if (!effectiveQuantity || effectiveQuantity <= 0) {
      newErrors.quantity = canBePackaged
        ? 'Please enter number of bags'
        : t('validation.quantityRequired') || 'Please enter quantity';
    }
    if (effectiveQuantity > availableStock) {
      newErrors.quantity =
        t('validation.insufficientStock') || 'Insufficient stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: BatchTransferRequest = {
      batch_id: selectedBatchId!,
      from_warehouse_id: sourceWarehouseId!,
      to_warehouse_id: destinationWarehouseId!,
      quantity: effectiveQuantity,
      notes: notes || undefined,
    };

    try {
      await batchTransfer.mutateAsync(data);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  if (warehousesLoading || allBatchesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${fullHeight ? 'flex h-full flex-col' : ''}`}>
      {/* Batch Selection - First */}
      <div
        className={`space-y-2 ${fullHeight ? 'flex min-h-0 flex-1 flex-col' : ''}`}
      >
        <Label>{t('selectBatch') || 'Select Batch to Transfer'}</Label>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder={
              t('searchBatch') ||
              'Search by batch code, product, or warehouse...'
            }
            value={batchSearch}
            onChange={(e) => setBatchSearch(e.target.value)}
          />
        </div>

        {/* Batch List */}
        <div
          className={`space-y-2 overflow-y-auto rounded-md border p-2 ${fullHeight ? 'flex-1' : 'max-h-80'} ${errors.batch ? 'border-destructive' : ''}`}
        >
          {filteredBatches.length > 0 ? (
            filteredBatches.map((batch) => (
              <BatchOption
                key={batch.id}
                batch={batch}
                isSelected={selectedBatchId === batch.id}
                onSelect={() => handleBatchSelect(batch)}
                showWarehouse={true}
              />
            ))
          ) : (
            <div className="text-muted-foreground py-4 text-center text-sm">
              {allBatches && allBatches.length === 0
                ? t('noBatches') || 'No batches available for transfer'
                : t('noBatchesFound') ||
                  'No batches found matching your search'}
            </div>
          )}
        </div>
        {errors.batch && (
          <p className="text-destructive text-sm">{errors.batch}</p>
        )}

        {/* Selected batch info */}
        {selectedBatch && (
          <div className="bg-primary/5 border-primary/20 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {selectedBatch.batch_code}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedBatch.product_type} • {selectedBatch.warehouse_name}
                </p>
              </div>
              <div className="flex flex-col items-end">
                {canBePackaged && packageCount > 0 ? (
                  <>
                    <Badge variant="secondary" className="font-semibold">
                      {packageCount} {packageTypeName}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
                      {availableStock.toLocaleString()} {unit}
                    </span>
                  </>
                ) : (
                  <Badge variant="secondary" className="font-semibold">
                    {availableStock.toLocaleString()} {unit}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Destination Warehouse - Only show after batch is selected */}
      {selectedBatch && (
        <div className="space-y-2">
          <Label>{t('destinationWarehouse')}</Label>
          <Select
            value={destinationWarehouseId?.toString() || ''}
            onValueChange={(value) => {
              setDestinationWarehouseId(parseInt(value));
              setErrors((prev) => ({...prev, destinationWarehouse: ''}));
            }}
          >
            <SelectTrigger
              className={
                errors.destinationWarehouse ? 'border-destructive' : ''
              }
            >
              <SelectValue placeholder={t('selectDestinationWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              {warehouses
                ?.filter((wh) => wh.id !== sourceWarehouseId)
                .map((wh) => (
                  <SelectItem key={wh.id} value={wh.id.toString()}>
                    {wh.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.destinationWarehouse && (
            <p className="text-destructive text-sm">
              {errors.destinationWarehouse}
            </p>
          )}
        </div>
      )}

      {/* Quantity/Bags - Only show after batch is selected */}
      {selectedBatch && (
        <div className="space-y-2">
          {canBePackaged && packageCount > 0 ? (
            // Bag-based input for packaged batches
            <>
              <Label>{packageTypeName} to Transfer</Label>
              <Input
                type="number"
                value={transferBags || ''}
                onChange={(e) => {
                  setTransferBags(parseInt(e.target.value) || 0);
                  setErrors((prev) => ({...prev, quantity: ''}));
                }}
                className={errors.quantity ? 'border-destructive' : ''}
                max={packageCount}
                min={0}
              />
              <div className="text-muted-foreground text-xs">
                {transferBags} / {packageCount} {packageTypeName} available
              </div>
              {transferBags > 0 && (
                <div className="bg-muted/50 rounded-md p-2 text-sm">
                  ={' '}
                  <span className="font-semibold">
                    {calculatedQuantityFromBags.toLocaleString()} {unit}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    ({transferBags} × {weightPerPackage}
                    {unit})
                  </span>
                </div>
              )}
              {errors.quantity && (
                <p className="text-destructive text-sm">{errors.quantity}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferBags(packageCount)}
                >
                  All {packageTypeName}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTransferBags(Math.floor(packageCount / 2))}
                >
                  Half
                </Button>
              </div>
            </>
          ) : (
            // Weight-based input for non-packaged batches
            <>
              <Label>
                {t('quantity')} ({unit})
              </Label>
              <Input
                type="number"
                value={quantity || ''}
                onChange={(e) => {
                  setQuantity(parseFloat(e.target.value) || 0);
                  setErrors((prev) => ({...prev, quantity: ''}));
                }}
                className={errors.quantity ? 'border-destructive' : ''}
                max={availableStock}
              />
              {errors.quantity && (
                <p className="text-destructive text-sm">{errors.quantity}</p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(availableStock)}
                >
                  {t('transferAll') || 'Transfer All'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.floor(availableStock / 2))}
                >
                  {t('transferHalf') || 'Half'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notes - Only show after batch is selected */}
      {selectedBatch && (
        <div className="space-y-2">
          <Label>
            {t('notes')} ({tCommon('optional')})
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={3}
          />
        </div>
      )}

      {/* Actions - render custom actions if provided, otherwise default */}
      {renderActions ? (
        renderActions({
          onSubmit: handleSubmit,
          isSubmitting: batchTransfer.isPending,
          isValid: isFormValid,
        })
      ) : (
        <div className="flex gap-2 pt-2">
          {showCancelButton && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {tCommon('cancel')}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={batchTransfer.isPending}
            className={showCancelButton ? 'flex-1' : 'w-full'}
          >
            {batchTransfer.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 size-4" />
                {t('submit')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Batch option component
function BatchOption({
  batch,
  isSelected,
  onSelect,
  showWarehouse = false,
}: {
  batch: BatchStock;
  isSelected: boolean;
  onSelect: () => void;
  showWarehouse?: boolean;
}) {
  // Format production date if available
  const prodDate = batch.production_date
    ? new Date(batch.production_date).toLocaleDateString()
    : null;

  // Package info
  const hasPackages =
    batch.can_be_packaged && batch.package_count && batch.package_count > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-2 rounded-md border p-3 text-left transition-colors ${
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Package className="text-muted-foreground size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{batch.batch_code}</p>
            {batch.status && (
              <Badge
                variant={batch.status === 'completed' ? 'secondary' : 'outline'}
                className="shrink-0 px-1.5 py-0 text-[10px]"
              >
                {batch.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {batch.product_type}
            {showWarehouse && ` • ${batch.warehouse_name}`}
          </p>
          {(batch.batch_name || prodDate) && (
            <p className="text-muted-foreground truncate text-[10px]">
              {batch.batch_name && <span>{batch.batch_name}</span>}
              {batch.batch_name && prodDate && ' • '}
              {prodDate && <span>Prod: {prodDate}</span>}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        {hasPackages ? (
          <>
            <Badge variant="secondary">
              {batch.package_count} {batch.package_type_name || 'bags'}
            </Badge>
            <span className="text-muted-foreground text-[10px]">
              {batch.quantity.toLocaleString()} {batch.unit}
            </span>
          </>
        ) : (
          <Badge variant="secondary">
            {batch.quantity.toLocaleString()} {batch.unit}
          </Badge>
        )}
      </div>
    </button>
  );
}
