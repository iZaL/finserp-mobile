'use client';

import {useState, useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  Save,
  Package,
  Search,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
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
import {cn} from '@/lib/utils';
import {
  useBatchStock,
  useBatchWarehouses,
  useBatchAdjustment,
  useBatchAdjustmentReasons,
} from '@/hooks/use-inventory';
import {InventoryGuard} from '@/components/permission-guard';
import type {BatchAdjustmentRequest, BatchStock} from '@/types/inventory';

export default function AdjustmentPage() {
  const router = useRouter();
  const t = useTranslations('inventory.adjustment');
  const tCommon = useTranslations('common');

  // State
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [batchSearch, setBatchSearch] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<
    'addition' | 'subtraction'
  >('addition');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries
  const {data: warehouses, isLoading: warehousesLoading} = useBatchWarehouses();
  const {data: batches, isLoading: batchesLoading} = useBatchStock({
    warehouse_id: warehouseId ?? undefined,
    search: batchSearch || undefined,
  });
  const {data: reasons} = useBatchAdjustmentReasons();
  const batchAdjustment = useBatchAdjustment();

  // Get selected batch
  const selectedBatch = useMemo(() => {
    if (!selectedBatchId || !batches) return null;
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [selectedBatchId, batches]);

  // Available stock for selected batch
  const availableStock = selectedBatch?.quantity ?? 0;
  const unit = selectedBatch?.unit ?? 'kg';

  // Reset batch when warehouse changes
  const handleWarehouseChange = (value: string) => {
    setWarehouseId(parseInt(value));
    setSelectedBatchId(null);
    setQuantity(0);
    setErrors((prev) => ({...prev, warehouse: '', batch: ''}));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!warehouseId) {
      newErrors.warehouse = t('validation.warehouseRequired');
    }
    if (!selectedBatchId) {
      newErrors.batch =
        t('validation.batchRequired') || 'Please select a batch';
    }
    if (!quantity || quantity <= 0) {
      newErrors.quantity = t('validation.quantityRequired');
    }
    if (adjustmentType === 'subtraction' && quantity > availableStock) {
      newErrors.quantity =
        t('validation.insufficientStock') || 'Insufficient stock';
    }
    if (!reason) {
      newErrors.reason = t('validation.reasonRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: BatchAdjustmentRequest = {
      batch_id: selectedBatchId!,
      type: adjustmentType,
      quantity,
      reason: reason,
      notes: notes || undefined,
    };

    try {
      await batchAdjustment.mutateAsync(data);
      router.push('/batches');
    } catch {
      // Error handled by mutation
    }
  };

  if (warehousesLoading) {
    return (
      <div className="container mx-auto space-y-6 p-4 pb-20">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <InventoryGuard>
      <div className="container mx-auto space-y-4 p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {adjustmentType === 'addition' ? (
                <Plus className="size-4 text-green-600" />
              ) : (
                <Minus className="size-4 text-red-600" />
              )}
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warehouse */}
            <div className="space-y-2">
              <Label>{t('warehouse')}</Label>
              <Select
                value={warehouseId?.toString() || ''}
                onValueChange={handleWarehouseChange}
              >
                <SelectTrigger
                  className={errors.warehouse ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder={t('selectWarehouse')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses?.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id.toString()}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse && (
                <p className="text-destructive text-sm">{errors.warehouse}</p>
              )}
            </div>

            {/* Batch Selection */}
            {warehouseId && (
              <div className="space-y-2">
                <Label>{t('selectBatch') || 'Select Batch'}</Label>

                {/* Search */}
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    placeholder={t('searchBatch') || 'Search batches...'}
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                  />
                </div>

                {/* Batch List */}
                <div
                  className={`max-h-48 space-y-2 overflow-y-auto rounded-md border p-2 ${errors.batch ? 'border-destructive' : ''}`}
                >
                  {batchesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : batches && batches.length > 0 ? (
                    batches.map((batch) => (
                      <BatchOption
                        key={batch.id}
                        batch={batch}
                        isSelected={selectedBatchId === batch.id}
                        onSelect={() => {
                          setSelectedBatchId(batch.id);
                          setErrors((prev) => ({...prev, batch: ''}));
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-muted-foreground py-4 text-center text-sm">
                      {t('noBatchesFound') ||
                        'No batches found in this warehouse'}
                    </div>
                  )}
                </div>
                {errors.batch && (
                  <p className="text-destructive text-sm">{errors.batch}</p>
                )}

                {/* Selected batch info */}
                {selectedBatch && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium">
                      {selectedBatch.batch_code} - {selectedBatch.product_type}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('currentStock') || 'Current Stock'}:{' '}
                      {availableStock.toLocaleString()} {unit}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>{t('type')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    adjustmentType === 'addition' ? 'default' : 'outline'
                  }
                  className={cn(
                    'h-12',
                    adjustmentType === 'addition' &&
                      'bg-green-600 hover:bg-green-700'
                  )}
                  onClick={() => setAdjustmentType('addition')}
                >
                  <Plus className="me-2 size-4" />
                  {t('addition')}
                </Button>
                <Button
                  type="button"
                  variant={
                    adjustmentType === 'subtraction' ? 'default' : 'outline'
                  }
                  className={cn(
                    'h-12',
                    adjustmentType === 'subtraction' &&
                      'bg-red-600 hover:bg-red-700'
                  )}
                  onClick={() => setAdjustmentType('subtraction')}
                >
                  <Minus className="me-2 size-4" />
                  {t('subtraction')}
                </Button>
              </div>
            </div>

            {/* Quantity */}
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
              />
              {errors.quantity && (
                <p className="text-destructive text-sm">{errors.quantity}</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>{t('reason')}</Label>
              <Select
                value={reason}
                onValueChange={(value) => {
                  setReason(value);
                  setErrors((prev) => ({...prev, reason: ''}));
                }}
              >
                <SelectTrigger
                  className={errors.reason ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder={t('selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  {reasons?.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                  {/* Fallback reasons if API doesn't return any */}
                  {(!reasons || reasons.length === 0) && (
                    <>
                      <SelectItem value="Variance">
                        {t('reasons.variance') || 'Variance'}
                      </SelectItem>
                      <SelectItem value="Damaged">
                        {t('reasons.damaged') || 'Damaged'}
                      </SelectItem>
                      <SelectItem value="Expired">
                        {t('reasons.expired') || 'Expired'}
                      </SelectItem>
                      <SelectItem value="Count Adjustment">
                        {t('reasons.count') || 'Count Adjustment'}
                      </SelectItem>
                      <SelectItem value="Other">
                        {t('reasons.other') || 'Other'}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="text-destructive text-sm">{errors.reason}</p>
              )}
            </div>

            {/* Notes */}
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
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="bg-background fixed right-0 bottom-0 left-0 border-t p-4">
          <Button
            onClick={handleSubmit}
            disabled={batchAdjustment.isPending}
            className={cn(
              'h-12 w-full text-base',
              adjustmentType === 'addition' &&
                'bg-green-600 hover:bg-green-700',
              adjustmentType === 'subtraction' && 'bg-red-600 hover:bg-red-700'
            )}
          >
            {batchAdjustment.isPending ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Save className="mr-2 size-5" />
                {t('submit')}
              </>
            )}
          </Button>
        </div>
      </div>
    </InventoryGuard>
  );
}

// Batch option component
function BatchOption({
  batch,
  isSelected,
  onSelect,
}: {
  batch: BatchStock;
  isSelected: boolean;
  onSelect: () => void;
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
          <p className="text-muted-foreground text-xs">{batch.product_type}</p>
        </div>
      </div>
      <Badge variant="secondary">
        {batch.quantity.toLocaleString()} {batch.unit}
      </Badge>
    </button>
  );
}
