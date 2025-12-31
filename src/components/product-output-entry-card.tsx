'use client';

import {useMemo} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {Droplet, Wheat} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {cn} from '@/lib/utils';
import type {
  ProductionProductType,
  ProductionPackageType,
  Warehouse,
} from '@/types/production-output';

// Helper to safely extract name from potentially localized object
function getDisplayName(
  name: string | Record<string, string> | undefined | null,
  locale: string = 'en'
): string {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (typeof name === 'object') {
    return name[locale] || name['en'] || Object.values(name)[0] || '';
  }
  return String(name);
}

export interface ProductOutputEntryData {
  productTypeId: number;
  packageTypeId?: number;
  packageCount?: number;
  tankCapacity?: number;
  fillCycles?: number;
  warehouseId?: number;
}

interface ProductOutputEntryCardProps {
  productType: ProductionProductType;
  packageTypes: ProductionPackageType[];
  warehouses: Warehouse[];
  data: ProductOutputEntryData;
  onChange: (data: ProductOutputEntryData) => void;
  className?: string;
}

export function ProductOutputEntryCard({
  productType,
  packageTypes,
  warehouses,
  data,
  onChange,
  className,
}: ProductOutputEntryCardProps) {
  const t = useTranslations('productionOutputs.entry');
  const locale = useLocale();
  const isFishmeal = productType.code === 'fishmeal';
  const Icon = isFishmeal ? Wheat : Droplet;

  const filteredPackageTypes = useMemo(
    () => packageTypes.filter((pt) => pt.product_type_id === productType.id),
    [packageTypes, productType.id]
  );

  const selectedPackageType = useMemo(
    () => packageTypes.find((pt) => pt.id === data.packageTypeId),
    [packageTypes, data.packageTypeId]
  );

  const weightPerPackage = selectedPackageType?.default_weight || 0;

  const calculatedTotal = useMemo(() => {
    if (productType.can_be_packaged) {
      return (data.packageCount || 0) * weightPerPackage;
    }
    return (data.fillCycles || 0) * (data.tankCapacity || 0);
  }, [
    productType.can_be_packaged,
    data.packageCount,
    weightPerPackage,
    data.fillCycles,
    data.tankCapacity,
  ]);

  const hasData = calculatedTotal > 0;

  const iconColor = isFishmeal ? 'text-amber-600' : 'text-blue-600';
  const bgGradient = isFishmeal
    ? 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
    : 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20';

  const handlePackageTypeChange = (value: string) => {
    const packageTypeId = parseInt(value);
    onChange({...data, packageTypeId});
  };

  const handlePackageCountChange = (value: string) => {
    const parsed = parseInt(value, 10);
    const packageCount = !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    onChange({...data, packageCount});
  };

  const handleTankCapacityChange = (value: string) => {
    const parsed = parseFloat(value);
    const tankCapacity = !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    onChange({...data, tankCapacity});
  };

  const handleFillCyclesChange = (value: string) => {
    const parsed = parseInt(value, 10);
    const fillCycles = !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    onChange({...data, fillCycles});
  };

  const handleWarehouseChange = (value: string) => {
    const warehouseId = value ? parseInt(value) : undefined;
    onChange({...data, warehouseId});
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader
        className={cn(
          'flex items-center rounded-t-lg bg-gradient-to-br pb-3',
          bgGradient
        )}
      >
        <div className="flex w-full items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base leading-none">
            <Icon className={cn('size-5 shrink-0', iconColor)} />
            <span>{getDisplayName(productType.name, locale)}</span>
          </CardTitle>
          {hasData && (
            <div className="text-primary text-sm font-semibold">
              {calculatedTotal.toLocaleString()} kg
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <div className="text-muted-foreground text-xs">
          {t('expected')}: ~{productType.yield_expected}% (
          {productType.yield_min}-{productType.yield_max}%)
        </div>

        {productType.can_be_packaged ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('packageType')}</Label>
              <Select
                value={data.packageTypeId?.toString() || ''}
                onValueChange={handlePackageTypeChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('selectPackageType')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredPackageTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>
                      {getDisplayName(pt.name, locale)} ({pt.default_weight} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('bagsProduced')}</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={data.packageCount ?? ''}
                onChange={(e) => handlePackageCountChange(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('tankCapacity')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={data.tankCapacity ?? ''}
                onChange={(e) => handleTankCapacityChange(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('fillCycles')}</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={data.fillCycles ?? ''}
                onChange={(e) => handleFillCyclesChange(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="bg-muted/50 text-muted-foreground rounded p-2 text-xs">
              {t('storage')}:{' '}
              {productType.default_storage_type === 'tank'
                ? t('tankStorage')
                : t('bulkStorage')}
            </div>
          </div>
        )}

        {hasData && (
          <div className="bg-muted/30 rounded-lg border p-3">
            <div className="text-muted-foreground mb-1 text-xs">
              {productType.can_be_packaged
                ? `${data.packageCount || 0} ${t('bags')} × ${weightPerPackage} kg`
                : `${data.fillCycles || 0} ${t('cycles')} × ${(data.tankCapacity || 0).toLocaleString()} kg`}
            </div>
            <div className="text-lg font-semibold">
              {t('total')}: {calculatedTotal.toLocaleString()} kg
            </div>
          </div>
        )}

        <div className="mt-auto border-t pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('warehouse')}</Label>
            <Select
              value={data.warehouseId?.toString() || ''}
              onValueChange={handleWarehouseChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('selectWarehouse')} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id.toString()}>
                    {getDisplayName(w.name, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
