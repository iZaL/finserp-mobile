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
}

export function TransferForm({
  initialBatchId,
  onSuccess,
  onCancel,
  showCancelButton = false,
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
    setErrors((prev) => ({...prev, batch: ''}));
  };

  // Available stock for selected batch
  const availableStock = selectedBatch?.quantity ?? 0;
  const unit = selectedBatch?.unit ?? 'kg';

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
    if (!quantity || quantity <= 0) {
      newErrors.quantity = t('validation.quantityRequired');
    }
    if (quantity > availableStock) {
      newErrors.quantity = t('validation.insufficientStock');
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
      quantity,
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
    <div className="space-y-4">
      {/* Batch Selection - First */}
      <div className="space-y-2">
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
          className={`max-h-56 space-y-2 overflow-y-auto rounded-md border p-2 ${errors.batch ? 'border-destructive' : ''}`}
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
              <Badge variant="secondary" className="font-semibold">
                {availableStock.toLocaleString()} {unit}
              </Badge>
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

      {/* Quantity - Only show after batch is selected */}
      {selectedBatch && (
        <div className="space-y-2">
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

      {/* Actions */}
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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <Package className="text-muted-foreground size-5" />
        <div>
          <p className="text-sm font-medium">{batch.batch_code}</p>
          <p className="text-muted-foreground text-xs">
            {batch.product_type}
            {showWarehouse && ` • ${batch.warehouse_name}`}
          </p>
        </div>
      </div>
      <Badge variant="secondary">
        {batch.quantity.toLocaleString()} {batch.unit}
      </Badge>
    </button>
  );
}
