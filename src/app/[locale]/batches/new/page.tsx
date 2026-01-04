'use client';

import {useMemo, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import {
  ArrowLeft,
  Layers,
  Package,
  Warehouse,
  Scale,
  Loader2,
  AlertTriangle,
  BoxSelect,
  Tag,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {productionOutputService} from '@/lib/services/production-output';
import {useCreateBatch} from '@/hooks/use-batches';
import {usePermissionStore} from '@/lib/stores/permission-store';
import {BatchesGuard} from '@/components/permission-guard';
import type {ProductionOutput} from '@/types/production-output';
import type {CreateBatchRequest} from '@/types/batch';

export default function CreateBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [batchName, setBatchName] = useState('');

  const outputIds = useMemo(() => {
    const ids = searchParams.get('output_ids');
    return ids ? ids.split(',').map(Number).filter(Boolean) : [];
  }, [searchParams]);

  const {
    data: outputsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['outputs-for-batch', outputIds],
    queryFn: async () => {
      if (outputIds.length === 0) return {data: []};
      const response = await productionOutputService.getProductionOutputs({});
      const allOutputs = response.data || [];
      return {
        data: allOutputs.filter((o: ProductionOutput) =>
          outputIds.includes(o.id)
        ),
      };
    },
    enabled: outputIds.length > 0,
  });

  const outputs = outputsData?.data || [];

  const {totalQuantity, productType, warehouse, packageType, packageCount} =
    useMemo(() => {
      if (!outputs.length) {
        return {
          totalQuantity: 0,
          productType: null,
          warehouse: null,
          packageType: null,
          packageCount: 0,
        };
      }

      const total = outputs.reduce(
        (sum: number, o: ProductionOutput) =>
          sum + (o.available_quantity ?? o.total_quantity),
        0
      );
      const packages = outputs.reduce(
        (sum: number, o: ProductionOutput) => sum + (o.package_count || 0),
        0
      );

      const firstPackageType = outputs.find(
        (o: ProductionOutput) => o.package_type
      )?.package_type;

      return {
        totalQuantity: total,
        productType: outputs[0]?.product_type,
        warehouse: outputs[0]?.warehouse,
        packageType: firstPackageType,
        packageCount: packages,
      };
    }, [outputs]);

  const productTypes = useMemo(() => {
    return [
      ...new Set(
        outputs.map((o: ProductionOutput) => o.production_product_type_id)
      ),
    ];
  }, [outputs]);

  const hasMultipleProductTypes = productTypes.length > 1;

  const createBatch = useCreateBatch();
  const {canCreateBatch: hasCreateBatchPermission} = usePermissionStore();

  useEffect(() => {
    if (outputIds.length === 0 || !hasCreateBatchPermission()) {
      router.replace('/production-outputs');
    }
  }, [outputIds, router, hasCreateBatchPermission]);

  const handleSubmit = async () => {
    if (!productType || hasMultipleProductTypes || !batchName.trim()) return;

    const request: CreateBatchRequest = {
      name: batchName.trim(),
      production_date: format(new Date(), 'yyyy-MM-dd'),
      products: [
        {
          product_type_id: productType.id,
          warehouse_id: warehouse?.id,
          package_type_id: packageType?.id,
          output_allocations: outputs.map((o: ProductionOutput) => ({
            output_id: o.id,
            quantity: o.available_quantity ?? o.total_quantity,
            package_count: o.package_count,
          })),
        },
      ],
    };

    try {
      await createBatch.mutateAsync(request);
      router.push('/production-outputs');
    } catch {
      // Error handled by hook
    }
  };

  if (outputIds.length === 0 || !hasCreateBatchPermission()) {
    return null;
  }

  return (
    <BatchesGuard>
      <div className="container mx-auto p-4 pb-32">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Batch</h1>
            <p className="text-muted-foreground text-sm">
              From {outputIds.length} production output
              {outputIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {error && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="text-destructive mb-4 size-12" />
              <p className="text-destructive mb-4 text-sm">
                Failed to load outputs
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && outputs.length > 0 && (
          <div className="space-y-4">
            {hasMultipleProductTypes && (
              <Card className="border-destructive">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertTriangle className="text-destructive size-5 shrink-0" />
                  <div>
                    <p className="text-destructive font-medium">
                      Cannot create batch
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Selected outputs have different product types. Please
                      select outputs of the same product type.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="size-5" />
                  Batch Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Batch Name Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="batchName"
                    className="flex items-center gap-2"
                  >
                    <Tag className="size-4" />
                    Batch Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="batchName"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Enter batch name"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                    <Package className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">Product</p>
                      <p className="truncate text-sm font-medium">
                        {productType?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                    <Warehouse className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">Warehouse</p>
                      <p className="truncate text-sm font-medium">
                        {warehouse?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 flex items-center gap-2 rounded-lg p-3">
                    <BoxSelect className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">Package</p>
                      <p className="truncate text-sm font-medium">
                        {packageType?.name || 'Bulk'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 flex items-center gap-3 rounded-lg p-4">
                  <Scale className="text-primary size-6" />
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Total Quantity
                    </p>
                    <p className="text-2xl font-bold">
                      {totalQuantity.toLocaleString()} kg
                    </p>
                    {packageCount > 0 && (
                      <p className="text-muted-foreground text-sm">
                        {packageCount} packages
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Outputs ({outputs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {outputs.map((output: ProductionOutput) => (
                    <div
                      key={output.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{output.record_number}</p>
                        <p className="text-muted-foreground text-xs">
                          {output.production_date} • {output.product_type?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums">
                          {(
                            output.available_quantity ?? output.total_quantity
                          ).toLocaleString()}{' '}
                          kg
                        </p>
                        {output.package_count && (
                          <p className="text-muted-foreground text-xs">
                            {output.package_count} pkgs
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-background/95 fixed right-0 bottom-16 left-0 z-50 border-t p-4 shadow-lg backdrop-blur-sm">
              <Button
                className="h-12 w-full text-lg"
                onClick={handleSubmit}
                disabled={
                  createBatch.isPending ||
                  hasMultipleProductTypes ||
                  !batchName.trim()
                }
              >
                {createBatch.isPending ? (
                  <>
                    <Loader2 className="me-2 size-5 animate-spin" />
                    Creating Batch...
                  </>
                ) : (
                  <>
                    <Layers className="me-2 size-5" />
                    Create Batch
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BatchesGuard>
  );
}
