'use client';

import {useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {Plus, ArrowLeft, Wheat, Droplet, Package} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {ProductionOutputsGuard} from '@/components/permission-guard';
import {ProductionOutputsTable} from '@/components/production-outputs-table';
import {useProductionOutputs} from '@/hooks/use-production-outputs';

// Format quantity with appropriate unit
function formatQuantity(quantity: number, showUnit = true): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})}${showUnit ? ' MT' : ''}`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 0})}${showUnit ? ' kg' : ''}`;
}

// Product Type Summary Card
function ProductTypeSummaryCard({
  name,
  code,
  quantity,
  recordCount,
  percentage,
}: {
  name: string;
  code: string;
  quantity: number;
  recordCount: number;
  percentage: number;
}) {
  const isFishmeal = code === 'fishmeal';
  const Icon = isFishmeal ? Wheat : Droplet;
  const gradient = isFishmeal
    ? 'from-amber-500 to-orange-600'
    : 'from-blue-500 to-cyan-600';
  const barColor = isFishmeal ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <Card className="group overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Header with gradient */}
      <div
        className={cn(
          'relative overflow-hidden rounded-t-xl bg-gradient-to-br p-4 text-white',
          gradient
        )}
      >
        {/* Background decoration */}
        <div className="absolute -top-3 -right-3 size-16 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 -left-2 size-12 rounded-full bg-white/5" />

        <div className="relative">
          <div className="mb-2 flex items-start justify-between">
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <Icon className="size-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur-sm">
              <span>{percentage.toFixed(1)}%</span>
            </div>
          </div>

          <h3 className="mb-0.5 text-base font-bold">{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight">
              {formatQuantity(quantity, false)}
            </span>
            <span className="text-sm font-medium text-white/80">
              {quantity >= 1000 ? 'MT' : 'kg'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Package className="text-muted-foreground size-3.5" />
            <span className="text-muted-foreground text-xs">
              {recordCount} records
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                barColor
              )}
              style={{width: `${percentage}%`}}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductionOutputsPage() {
  const router = useRouter();
  const t = useTranslations('productionOutputs');

  // Fetch production outputs for summary stats
  const {data, isLoading} = useProductionOutputs({});

  // Calculate product type statistics
  const productTypes = useMemo(() => {
    if (!data?.data?.length) return [];

    const outputs = data.data;
    const totalQuantity = outputs.reduce((sum, o) => sum + o.total_quantity, 0);

    // Group by product type
    const byType: Record<
      string,
      {name: string; code: string; quantity: number; count: number}
    > = {};

    outputs.forEach((output) => {
      const typeName = output.product_type?.name || 'Other';
      const typeCode =
        output.product_type?.code ||
        typeName.toLowerCase().replace(/\s+/g, '_');

      if (!byType[typeName]) {
        byType[typeName] = {
          name: typeName,
          code: typeCode,
          quantity: 0,
          count: 0,
        };
      }
      byType[typeName].quantity += output.total_quantity;
      byType[typeName].count += 1;
    });

    return Object.values(byType).map((pt) => ({
      ...pt,
      percentage: totalQuantity > 0 ? (pt.quantity / totalQuantity) * 100 : 0,
    }));
  }, [data?.data]);

  return (
    <ProductionOutputsGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-24">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/production-outputs/new')}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md hover:from-indigo-600 hover:to-violet-700"
            >
              <Plus className="me-2 size-4" />
              {t('add')}
            </Button>
          </div>
        </div>

        <div className="container mx-auto space-y-6 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {/* Product Type Breakdown */}
              {productTypes.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {productTypes.map((pt) => (
                    <ProductTypeSummaryCard
                      key={pt.code}
                      name={pt.name}
                      code={pt.code}
                      quantity={pt.quantity}
                      recordCount={pt.count}
                      percentage={pt.percentage}
                    />
                  ))}
                </div>
              )}

              {/* Production Outputs Table */}
              <div>
                <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
                  {t('summary.allRecords') || 'All Records'}
                </h2>
                <ProductionOutputsTable
                  showBatchingCard={true}
                  showEmptyState={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </ProductionOutputsGuard>
  );
}
