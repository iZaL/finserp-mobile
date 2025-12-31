'use client';

import {useState, useMemo, useCallback, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useSearchParams} from 'next/navigation';
import {useTranslations, useLocale} from 'next-intl';
import {ChevronLeft, Loader2, Save, Factory} from 'lucide-react';
import {Button} from '@/components/ui/button';
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
import {
  useProductionOutputFormData,
  useBulkCreateProductionOutputs,
} from '@/hooks/use-production-outputs';
import {
  ProductOutputEntryCard,
  type ProductOutputEntryData,
} from '@/components/product-output-entry-card';
import type {
  StorageType,
  BulkCreateProductionOutputRequest,
  OutputProductEntry,
} from '@/types/production-output';
import {ProductionOutputsGuard} from '@/components/permission-guard';

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

export default function CreateProductionOutputPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('productionOutputs.new');
  const locale = useLocale();
  const {data: formDataOptions, isLoading: isLoadingFormData} =
    useProductionOutputFormData();
  const bulkCreateMutation = useBulkCreateProductionOutputs();

  // Parse URL params from production runs dashboard - using useState to avoid hydration issues
  const [urlParams, setUrlParams] = useState({
    runId: null as number | null,
    shiftId: null as number | null,
    fromDashboard: false,
  });

  useEffect(() => {
    const runId = searchParams.get('run_id');
    const shiftId = searchParams.get('shift_id');
    setUrlParams({
      runId: runId ? parseInt(runId) : null,
      shiftId: shiftId ? parseInt(shiftId) : null,
      fromDashboard: !!runId,
    });
  }, [searchParams]);

  // Form state - initialize with empty string to avoid hydration mismatch
  const [productionDate, setProductionDate] = useState('');

  // Set production date on client side only
  useEffect(() => {
    setProductionDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [shiftId, setShiftId] = useState<number | null>(null);

  // Update shiftId when urlParams changes
  useEffect(() => {
    if (urlParams.shiftId) {
      setShiftId(urlParams.shiftId);
    }
  }, [urlParams.shiftId]);

  // Product output entries state - keyed by product type ID
  const [productEntries, setProductEntries] = useState<
    Record<number, ProductOutputEntryData>
  >({});

  // Initialize product entries when form data loads
  useEffect(() => {
    if (formDataOptions?.product_types) {
      const initialEntries: Record<number, ProductOutputEntryData> = {};
      formDataOptions.product_types.forEach((pt) => {
        // Use default_package_type_id from product type, or fall back to first package type for this product
        let packageTypeId = pt.default_package_type_id;
        if (!packageTypeId && pt.can_be_packaged) {
          const firstPackageType = formDataOptions.package_types.find(
            (pkg) => pkg.product_type_id === pt.id
          );
          packageTypeId = firstPackageType?.id;
        }
        initialEntries[pt.id] = {
          productTypeId: pt.id,
          packageTypeId,
          packageCount: undefined,
          tankCapacity: undefined,
          fillCycles: undefined,
          warehouseId: undefined,
        };
      });
      setProductEntries(initialEntries);
    }
  }, [formDataOptions]);

  const handleEntryChange = useCallback(
    (productTypeId: number, data: ProductOutputEntryData) => {
      setProductEntries((prev) => ({
        ...prev,
        [productTypeId]: data,
      }));
    },
    []
  );

  // Calculate total output across all products
  const totalOutput = useMemo(() => {
    let total = 0;
    if (!formDataOptions) return total;

    Object.entries(productEntries).forEach(([productTypeIdStr, entry]) => {
      const productTypeId = parseInt(productTypeIdStr);
      const productType = formDataOptions.product_types.find(
        (pt) => pt.id === productTypeId
      );
      if (!productType) return;

      if (productType.can_be_packaged) {
        const packageType = formDataOptions.package_types.find(
          (pt) => pt.id === entry.packageTypeId
        );
        const weightPerPackage = packageType?.default_weight || 0;
        total += (entry.packageCount || 0) * weightPerPackage;
      } else {
        total += (entry.fillCycles || 0) * (entry.tankCapacity || 0);
      }
    });

    return total;
  }, [productEntries, formDataOptions]);

  // Check if any product has data
  const hasAnyData = useMemo(() => {
    return Object.values(productEntries).some((entry) => {
      return (
        (entry.packageCount && entry.packageCount > 0) ||
        (entry.fillCycles && entry.fillCycles > 0)
      );
    });
  }, [productEntries]);

  const handleSubmit = async () => {
    if (!formDataOptions || !hasAnyData) return;

    // Build products array from entries with data
    const products: OutputProductEntry[] = [];

    Object.entries(productEntries).forEach(([productTypeIdStr, entry]) => {
      const productTypeId = parseInt(productTypeIdStr);
      const productType = formDataOptions.product_types.find(
        (pt) => pt.id === productTypeId
      );
      if (!productType) return;

      // Check if this entry has data
      const hasData = productType.can_be_packaged
        ? entry.packageCount && entry.packageCount > 0
        : entry.fillCycles && entry.fillCycles > 0;

      if (!hasData) return;

      const storageType: StorageType = productType.can_be_packaged
        ? 'packaged'
        : productType.default_storage_type || 'tank';

      products.push({
        product_type_id: productTypeId,
        storage_type: storageType,
        package_type_id: entry.packageTypeId,
        package_count: entry.packageCount,
        tank_capacity: entry.tankCapacity,
        fill_cycles: entry.fillCycles,
        warehouse_id: entry.warehouseId,
      });
    });

    if (products.length === 0) return;

    const requestData: BulkCreateProductionOutputRequest = {
      production_date: productionDate,
      production_run_id: urlParams.runId || undefined,
      shift_id: shiftId || undefined,
      products,
    };

    try {
      await bulkCreateMutation.mutateAsync(requestData);

      // Redirect back to production runs dashboard if came from there
      if (urlParams.fromDashboard) {
        router.push('/production-runs');
      } else {
        router.push('/production-outputs');
      }
    } catch (error) {
      console.error('Failed to create production outputs:', error);
    }
  };

  if (isLoadingFormData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const activeProductTypes =
    formDataOptions?.product_types.filter((pt) => pt.is_active) || [];

  return (
    <ProductionOutputsGuard>
      <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-4 pb-32">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
          </div>
        </div>

        {/* Context banner when coming from production runs dashboard */}
        {urlParams.fromDashboard && (
          <div className="bg-primary/10 border-primary/20 mb-6 flex items-center gap-3 rounded-lg border p-4">
            <Factory className="text-primary size-5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">{t('activeRunBanner')}</span>
              <span className="text-muted-foreground ms-1">
                ({t('runNumber', {runId: urlParams.runId ?? 0})})
              </span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Production Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('productionInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    {t('productionDate')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    {t('shift')}{' '}
                    {urlParams.fromDashboard && (
                      <span className="text-muted-foreground text-xs">
                        {t('fromRun')}
                      </span>
                    )}
                  </Label>
                  <Select
                    value={shiftId?.toString() || 'none'}
                    onValueChange={(v) =>
                      setShiftId(v === 'none' ? null : parseInt(v))
                    }
                    disabled={urlParams.fromDashboard}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('selectShift')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noShift')}</SelectItem>
                      {formDataOptions?.shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {getDisplayName(shift.name, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Type Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {t('outputByProductType')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeProductTypes.map((productType) => (
                <ProductOutputEntryCard
                  key={productType.id}
                  productType={productType}
                  packageTypes={formDataOptions?.package_types || []}
                  warehouses={formDataOptions?.warehouses || []}
                  data={
                    productEntries[productType.id] || {
                      productTypeId: productType.id,
                    }
                  }
                  onChange={(data) => handleEntryChange(productType.id, data)}
                />
              ))}
            </div>
          </div>

          {/* Total Summary */}
          {hasAnyData && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('totalOutput')}</span>
                  <span className="text-primary text-2xl font-bold">
                    {totalOutput.toLocaleString()} kg
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Submit Button */}
        <div className="bg-background border-border fixed right-0 bottom-0 left-0 z-40 border-t px-4 pt-4 pb-20 shadow-lg">
          <div className="mx-auto max-w-2xl">
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              disabled={!hasAnyData || bulkCreateMutation.isPending}
            >
              {bulkCreateMutation.isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="me-2 size-4" />
                  {t('saveAsDraft')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProductionOutputsGuard>
  );
}
