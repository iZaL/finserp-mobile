'use client';

import {use, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Package,
  Scale,
  Warehouse,
  Calendar,
  Clock,
  Boxes,
  Cylinder,
  FileText,
  AlertCircle,
  Wheat,
  Droplet,
  User,
  ChevronRight,
  Link2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useProductionOutput,
  useConfirmProductionOutput,
} from '@/hooks/use-production-outputs';
import type {
  ProductionOutputStatus,
  StorageType,
} from '@/types/production-output';
import {ProductionOutputsGuard} from '@/components/permission-guard';
import {cn} from '@/lib/utils';

// Get product type styling
function getProductTypeStyle(typeName?: string) {
  const isFishmeal = typeName?.toLowerCase().includes('fishmeal');
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

// Info row component
function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between py-2.5', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-muted-foreground size-4" />}
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ProductionOutputDetailsPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = use(params);
  const router = useRouter();
  const {data: output, isLoading: loading} = useProductionOutput(parseInt(id));
  const confirmMutation = useConfirmProductionOutput();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const getStatusConfig = (status: ProductionOutputStatus) => {
    switch (status) {
      case 'draft':
        return {
          color:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          label: 'Draft',
        };
      case 'confirmed':
        return {
          color:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          label: 'Confirmed',
        };
      case 'verified':
        return {
          color:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          label: 'Verified',
        };
      case 'voided':
        return {
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          label: 'Voided',
        };
      default:
        return {
          color:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          label: status,
        };
    }
  };

  const getStorageIcon = (storageType: StorageType) => {
    switch (storageType) {
      case 'packaged':
        return Boxes;
      case 'tank':
        return Cylinder;
      case 'bulk':
        return Package;
    }
  };

  const getStorageLabel = (storageType: StorageType) => {
    return storageType.charAt(0).toUpperCase() + storageType.slice(1);
  };

  const handleConfirm = () => {
    confirmMutation.mutate(parseInt(id), {
      onSuccess: () => {
        setConfirmDialogOpen(false);
      },
    });
  };

  if (loading) {
    return (
      <div className="from-muted/30 to-background flex min-h-screen items-center justify-center bg-gradient-to-b">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="from-muted/30 to-background flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
        <div className="bg-muted mb-4 rounded-full p-4">
          <AlertCircle className="text-muted-foreground size-8" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Not Found</h2>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Production output not found
        </p>
        <Button onClick={() => router.push('/production-outputs')}>
          Back to List
        </Button>
      </div>
    );
  }

  const productStyle = getProductTypeStyle(output.product_type?.name);
  const ProductIcon = productStyle.icon;
  const statusConfig = getStatusConfig(output.status);
  const StorageIcon = getStorageIcon(output.storage_type);

  return (
    <ProductionOutputsGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-32">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Production Output</h1>
              <p className="text-muted-foreground text-xs">Record details</p>
            </div>
            <Badge className={cn('text-xs', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="container mx-auto space-y-4 p-4">
          {/* Hero Card */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div
              className={cn(
                'relative overflow-hidden rounded-t-xl bg-gradient-to-br p-5 text-white',
                productStyle.gradient
              )}
            >
              {/* Background decoration */}
              <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 size-20 rounded-full bg-white/5" />
              <div className="absolute top-4 right-4 size-8 rounded-full bg-white/10" />

              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                    <ProductIcon className="size-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/80">Record Number</p>
                    <p className="text-lg font-bold">{output.record_number}</p>
                  </div>
                </div>

                <p className="mb-1 text-sm text-white/80">
                  {output.product_type?.name || 'Product'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {output.total_quantity.toLocaleString()}
                  </span>
                  <span className="text-lg font-medium text-white/80">
                    {output.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <CardContent className="grid grid-cols-3 divide-x p-0">
              <div className="p-4 text-center">
                <Calendar className="text-muted-foreground mx-auto mb-1.5 size-5" />
                <p className="text-xs font-medium">
                  {output.production_date_formatted ||
                    new Date(output.production_date).toLocaleDateString(
                      'en-GB',
                      {
                        day: '2-digit',
                        month: 'short',
                      }
                    )}
                </p>
                <p className="text-muted-foreground text-[10px]">Date</p>
              </div>
              <div className="p-4 text-center">
                <StorageIcon className="text-muted-foreground mx-auto mb-1.5 size-5" />
                <p className="text-xs font-medium">
                  {getStorageLabel(output.storage_type)}
                </p>
                <p className="text-muted-foreground text-[10px]">Storage</p>
              </div>
              <div className="p-4 text-center">
                <Warehouse className="text-muted-foreground mx-auto mb-1.5 size-5" />
                <p className="truncate text-xs font-medium">
                  {output.warehouse?.name || '-'}
                </p>
                <p className="text-muted-foreground text-[10px]">Warehouse</p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Details Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2 text-white">
                <StorageIcon className="size-4" />
              </div>
              <h3 className="font-semibold">Storage Details</h3>
            </div>
            <CardContent className="divide-y p-0">
              <InfoRow
                icon={Package}
                label="Storage Type"
                value={getStorageLabel(output.storage_type)}
                className="px-4"
              />

              {output.storage_type === 'packaged' && (
                <>
                  <InfoRow
                    icon={Boxes}
                    label="Package Type"
                    value={output.package_type?.name || '-'}
                    className="px-4"
                  />
                  <InfoRow
                    icon={Boxes}
                    label="Bags Produced"
                    value={output.package_count || 0}
                    className="px-4"
                  />
                  <InfoRow
                    icon={Scale}
                    label="Weight per Bag"
                    value={`${output.weight_per_package || 0} ${output.unit}`}
                    className="px-4"
                  />
                </>
              )}

              {output.storage_type === 'tank' && (
                <>
                  <InfoRow
                    icon={Cylinder}
                    label="Tank Capacity"
                    value={`${output.tank_capacity || 0} ${output.unit}`}
                    className="px-4"
                  />
                  <InfoRow
                    icon={Cylinder}
                    label="Fill Cycles"
                    value={output.fill_cycles || 0}
                    className="px-4"
                  />
                </>
              )}

              <div className="bg-muted/30 flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Scale className={cn('size-4', productStyle.textColor)} />
                  <span className="font-medium">Total Quantity</span>
                </div>
                <span
                  className={cn('text-lg font-bold', productStyle.textColor)}
                >
                  {output.total_quantity.toLocaleString()} {output.unit}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Record Info Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 p-2 text-white">
                <FileText className="size-4" />
              </div>
              <h3 className="font-semibold">Record Information</h3>
            </div>
            <CardContent className="divide-y p-0">
              <InfoRow
                icon={Calendar}
                label="Production Date"
                value={
                  output.production_date_formatted ||
                  new Date(output.production_date).toLocaleDateString()
                }
                className="px-4"
              />

              {output.shift && (
                <InfoRow
                  icon={Clock}
                  label="Shift"
                  value={output.shift.name}
                  className="px-4"
                />
              )}

              <InfoRow
                icon={Warehouse}
                label="Warehouse"
                value={output.warehouse?.name || '-'}
                className="px-4"
              />

              {output.operator && (
                <InfoRow
                  icon={User}
                  label="Operator"
                  value={output.operator.name}
                  className="px-4"
                />
              )}

              {output.creator && (
                <InfoRow
                  icon={User}
                  label="Created By"
                  value={output.creator.name}
                  className="px-4"
                />
              )}

              <InfoRow
                icon={Clock}
                label="Created At"
                value={new Date(output.created_at).toLocaleString()}
                className="px-4"
              />
            </CardContent>
          </Card>

          {/* Notes Card */}
          {output.notes && (
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-2 text-white">
                  <FileText className="size-4" />
                </div>
                <h3 className="font-semibold">Notes</h3>
              </div>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-sm">{output.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Linked Batch Card */}
          {output.batch_allocations && output.batch_allocations.length > 0 && (
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white">
                  <Link2 className="size-4" />
                </div>
                <h3 className="font-semibold">Linked Batch</h3>
                <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle className="mr-1 size-3" />
                  Allocated
                </Badge>
              </div>
              <CardContent className="p-0">
                <button
                  className="hover:bg-muted/50 flex w-full items-center gap-3 p-4 transition-colors"
                  onClick={() => {
                    // Navigate to batch if needed
                  }}
                >
                  <div className="bg-muted flex size-10 items-center justify-center rounded-xl">
                    <Boxes className="text-muted-foreground size-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">
                      {output.batch_allocations[0].batch?.batch_code}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Allocated:{' '}
                      {output.batch_allocations[0].allocated_quantity?.toLocaleString() ||
                        output.total_quantity.toLocaleString()}{' '}
                      {output.unit}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-5" />
                </button>

                {(output.verified_at || output.verifier) && (
                  <div className="border-t">
                    {output.verified_at && (
                      <InfoRow
                        icon={Clock}
                        label="Verified At"
                        value={new Date(output.verified_at).toLocaleString()}
                        className="px-4"
                      />
                    )}
                    {output.verifier && (
                      <InfoRow
                        icon={User}
                        label="Verified By"
                        value={output.verifier.name}
                        className="border-t px-4"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confirm Button */}
        {output.status === 'draft' && (
          <div className="bg-background/95 fixed right-0 bottom-16 left-0 z-50 border-t p-4 shadow-lg backdrop-blur-sm">
            <div className="container mx-auto">
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:from-emerald-600 hover:to-teal-700"
                size="lg"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Confirm Output
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <AlertDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Production Output</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to confirm this production output? This
                will mark it as confirmed and it can no longer be edited.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProductionOutputsGuard>
  );
}
