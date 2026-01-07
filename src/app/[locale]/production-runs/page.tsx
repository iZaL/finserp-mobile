'use client';

import {useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Plus,
  Factory,
  RefreshCw,
  ArrowLeft,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {ProductionRunsGuard} from '@/components/permission-guard';
import {usePermissions} from '@/lib/stores/permission-store';
import {useProductionRuns} from '@/hooks/use-production-runs';
import {DateGroupedList, groupByDate} from '@/components/date-grouped-list';
import {cn} from '@/lib/utils';
import type {
  ProductionRunListItem,
  ProductionRunStatus,
} from '@/types/production-run';

// Status styling helper
function getStatusStyle(status: ProductionRunStatus) {
  switch (status) {
    case 'in_progress':
      return {
        gradient: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        icon: Play,
      };
    case 'completed':
      return {
        gradient: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        icon: CheckCircle2,
      };
    case 'planned':
      return {
        gradient: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        textColor: 'text-amber-600 dark:text-amber-400',
        icon: Clock,
      };
    case 'canceled':
      return {
        gradient: 'from-red-500 to-rose-600',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        textColor: 'text-red-600 dark:text-red-400',
        icon: AlertCircle,
      };
    default:
      return {
        gradient: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-50 dark:bg-slate-950/30',
        textColor: 'text-slate-600 dark:text-slate-400',
        icon: Factory,
      };
  }
}

// Run Row Component - compact version for accordion
function RunRow({
  run,
  onClick,
  getStatusLabel,
}: {
  run: ProductionRunListItem;
  onClick: () => void;
  getStatusLabel: (status: ProductionRunStatus) => string;
}) {
  const style = getStatusStyle(run.status);
  const StatusIcon = style.icon;

  // Calculate duration
  const getDuration = () => {
    if (!run.started_at) return null;
    const start = new Date(run.started_at);
    const end = run.completed_at ? new Date(run.completed_at) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };
  const duration = getDuration();

  const time = new Date(run.started_at || run.created_at).toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div
      className="hover:bg-muted/50 active:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors"
      onClick={onClick}
    >
      {/* Status icon */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          style.bgColor
        )}
      >
        <StatusIcon className={cn('size-4', style.textColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: Name */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{run.name}</span>
          <Badge
            className={cn(
              'shrink-0 px-1 py-0 text-[9px]',
              style.bgColor,
              style.textColor
            )}
          >
            {getStatusLabel(run.status)}
          </Badge>
        </div>

        {/* Bottom row: Time + meta */}
        <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
          <span className="shrink-0 tabular-nums">{time}</span>
          {duration && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="size-3" />
                {duration}
              </span>
            </>
          )}
          {run.operator && (
            <>
              <span>•</span>
              <span className="truncate">{run.operator.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Output summary - compact */}
      {run.outputs_by_product_type &&
        run.outputs_by_product_type.length > 0 && (
          <div className="shrink-0 text-right">
            {run.outputs_by_product_type.slice(0, 2).map((output) => (
              <div
                key={output.product_type_id}
                className="text-xs font-semibold tabular-nums"
              >
                <span className="text-muted-foreground">
                  {output.product_type_code ||
                    output.product_type_name?.slice(0, 2)}
                  :
                </span>{' '}
                {output.total_quantity >= 1000
                  ? `${(output.total_quantity / 1000).toFixed(1)} TON`
                  : `${output.total_quantity.toLocaleString()} kg`}
              </div>
            ))}
          </div>
        )}

      {/* Chevron */}
      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
    </div>
  );
}

export default function ProductionRunsPage() {
  const router = useRouter();
  const t = useTranslations('productionRuns');
  const permissions = usePermissions();

  const {
    data: runsData,
    isLoading,
    refetch,
    isRefetching,
  } = useProductionRuns({
    per_page: 50,
  });

  const getStatusLabel = (status: ProductionRunStatus) => {
    switch (status) {
      case 'in_progress':
        return t('runStatus.in_progress');
      case 'completed':
        return t('runStatus.completed');
      case 'planned':
        return t('runStatus.planned');
      case 'canceled':
        return t('runStatus.canceled');
      default:
        return status;
    }
  };

  // Group runs by date
  const groupedRuns = useMemo(() => {
    if (!runsData?.data) return [];
    return groupByDate(runsData.data, (run) => {
      const dateStr = run.date || run.started_at || run.created_at;
      return dateStr.split('T')[0]; // Get just the date part
    });
  }, [runsData]);

  const handleRunClick = (id: number) => {
    router.push(`/production-runs/${id}`);
  };

  return (
    <ProductionRunsGuard>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw
                  className={cn('size-4', isRefetching && 'animate-spin')}
                />
              </Button>
              {permissions.canCreateProductionRun() && (
                <Button
                  onClick={() => router.push('/production-runs/new')}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm"
                >
                  <Plus className="me-1 size-4" />
                  {t('createNew')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          )}

          {!isLoading && groupedRuns.length > 0 && (
            <DateGroupedList
              groups={groupedRuns}
              getItemKey={(run) => run.id}
              defaultExpanded={true}
              renderItem={(run) => (
                <RunRow
                  run={run}
                  onClick={() => handleRunClick(run.id)}
                  getStatusLabel={getStatusLabel}
                />
              )}
            />
          )}

          {/* Empty State */}
          {!isLoading && groupedRuns.length === 0 && (
            <Card className="mx-4 border-0 shadow-md">
              <div className="py-12 text-center">
                <div className="bg-muted mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                  <Factory className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-1 font-semibold">{t('empty.title')}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {t('empty.description')}
                </p>
                {permissions.canCreateProductionRun() && (
                  <Button
                    onClick={() => router.push('/production-runs/new')}
                    className="bg-gradient-to-r from-emerald-500 to-green-600"
                  >
                    <Plus className="me-2 size-4" />
                    {t('createFirst')}
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProductionRunsGuard>
  );
}
