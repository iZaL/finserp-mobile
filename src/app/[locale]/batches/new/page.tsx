'use client';

import {useMemo, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useQuery} from '@tanstack/react-query';
import {format} from 'date-fns';
import {
  ArrowLeft,
  Layers,
  Package,
  Warehouse as WarehouseIcon,
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
import {batchInventoryService} from '@/lib/services/inventory';
import {useCreateBatch} from '@/hooks/use-batches';
import {usePermissionStore} from '@/lib/stores/permission-store';
import {BatchesGuard} from '@/components/permission-guard';
import {
  ProductionOutputRow,
  type OutputAllocation,
} from '@/components/production-output-row';
import type {ProductionOutput, Warehouse} from '@/types/production-output';
import type {CreateBatchRequest} from '@/types/batch';

export default function CreateBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [batchName, setBatchName] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  );
  const [allocations, setAllocations] = useState<
    Record<number, OutputAllocation>
  >({});

  const outputIds = useMemo(() => {
    const ids = searchParams.get('output_ids');
    return ids ? ids.split(',').map(Number).filter(Boolean) : [];
  }, [searchParams]);

  const {
    data: outputsData,
    isLoading: outputsLoading,
    error: outputsError,
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

  const {data: warehousesData, isLoading: warehousesLoading} = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => batchInventoryService.getWarehouses(),
  });

  const outputs = outputsData?.data || [];
  const warehouses: Warehouse[] = warehousesData || [];
  const isLoading = outputsLoading || warehousesLoading;
  const error = outputsError;

  // Initialize allocations when outputs are loaded - use AVAILABLE bags, not total
  useEffect(() => {
    if (outputs.length > 0 && Object.keys(allocations).length === 0) {
      const initialAllocations: Record<number, OutputAllocation> = {};
      outputs.forEach((o: ProductionOutput) => {
        const weightPerBag = o.weight_per_package || 50;
        // Calculate available bags from available_quantity
        // Use round() instead of floor() to avoid floating point precision issues
        const availableQty = o.available_quantity ?? o.total_quantity;
        const availableBags = Math.round(availableQty / weightPerBag);
        initialAllocations[o.id] = {
          bags: availableBags,
          quantity: availableBags * weightPerBag,
        };
      });
      setAllocations(initialAllocations);
    }
  }, [outputs, allocations]);

  const handleAllocationChange = (id: number, bags: number) => {
    const output = outputs.find((o: ProductionOutput) => o.id === id);
    if (!output) return;

    const weightPerBag = output.weight_per_package || 50;
    setAllocations((prev) => ({
      ...prev,
      [id]: {
        bags,
        quantity: bags * weightPerBag,
      },
    }));
  };

  // Check if outputs are from multiple warehouses
  const outputWarehouseIds = useMemo(() => {
    const ids = new Set<number>();
    outputs.forEach((o: ProductionOutput) => {
      if (o.warehouse?.id) {
        ids.add(o.warehouse.id);
      }
    });
    return ids;
  }, [outputs]);

  const hasMultipleSourceWarehouses = outputWarehouseIds.size > 1;

  // Auto-select first warehouse when outputs load
  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  // Get the selected warehouse object
  const selectedWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === selectedWarehouseId) || null;
  }, [warehouses, selectedWarehouseId]);

  const {totalQuantity, productType, packageType, packageCount} =
    useMemo(() => {
      if (!outputs.length) {
        return {
          totalQuantity: 0,
          productType: null,
          packageType: null,
          packageCount: 0,
        };
      }

      // Calculate based on allocations for all outputs
      let total = 0;
      let packages = 0;

      outputs.forEach((o: ProductionOutput) => {
        const alloc = allocations[o.id];
        if (alloc) {
          total += alloc.quantity;
          packages += alloc.bags;
        } else {
          total += o.available_quantity ?? o.total_quantity;
          packages += o.package_count || 0;
        }
      });

      const firstPackageType = outputs.find(
        (o: ProductionOutput) => o.package_type
      )?.package_type;

      return {
        totalQuantity: total,
        productType: outputs[0]?.product_type,
        packageType: firstPackageType,
        packageCount: packages,
      };
    }, [outputs, allocations]);

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
    if (
      !productType ||
      hasMultipleProductTypes ||
      !selectedWarehouseId ||
      !batchName.trim()
    )
      return;

    const request: CreateBatchRequest = {
      name: batchName.trim(),
      production_date: format(new Date(), 'yyyy-MM-dd'),
      products: [
        {
          product_type_id: productType.id,
          warehouse_id: selectedWarehouseId,
          package_type_id: packageType?.id,
          output_allocations: outputs
            .map((o: ProductionOutput) => {
              const alloc = allocations[o.id];
              const bags = alloc?.bags ?? o.package_count ?? 0;
              const weightPerBag = o.weight_per_package || 50;
              return {
                output_id: o.id,
                quantity: bags * weightPerBag,
                package_count: bags,
              };
            })
            .filter((a) => a.package_count > 0),
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

            {hasMultipleSourceWarehouses && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="flex items-center gap-3 py-4">
                  <WarehouseIcon className="size-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Multiple source warehouses
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Outputs from {outputWarehouseIds.size} different
                      warehouses. Select destination warehouse below.
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

                {/* Warehouse selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <WarehouseIcon className="size-4" />
                    Batch Warehouse
                    {hasMultipleSourceWarehouses && (
                      <span className="text-muted-foreground text-xs font-normal">
                        (select destination)
                      </span>
                    )}
                  </Label>
                  <select
                    value={selectedWarehouseId || ''}
                    onChange={(e) =>
                      setSelectedWarehouseId(Number(e.target.value))
                    }
                    className="border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Allocate Bags ({outputs.length})</span>
                  <span className="text-muted-foreground text-sm font-normal">
                    Select bags to include
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {outputs.map((output: ProductionOutput) => (
                    <ProductionOutputRow
                      key={output.id}
                      output={output}
                      mode="allocate"
                      allocation={allocations[output.id]}
                      onAllocationChange={handleAllocationChange}
                      showWarehouse={hasMultipleSourceWarehouses}
                      showChevron={false}
                    />
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
                  !selectedWarehouseId ||
                  !batchName.trim() ||
                  packageCount === 0
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
