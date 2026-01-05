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

// Date grouping helper
function getDateGroup(
  dateStr: string
): 'today' | 'yesterday' | 'thisWeek' | 'earlier' {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'today';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else if (dateOnly >= weekStart) {
    return 'thisWeek';
  }
  return 'earlier';
}

interface GroupedRuns {
  today: ProductionRunListItem[];
  yesterday: ProductionRunListItem[];
  thisWeek: ProductionRunListItem[];
  earlier: ProductionRunListItem[];
}

// Run Card Component
function RunCard({
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
  const runDate = new Date(run.date || run.started_at || run.created_at);
  const isToday =
    getDateGroup(run.date || run.started_at || run.created_at) === 'today';

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

  // Relative time for today
  const getRelativeTime = () => {
    const now = new Date();
    const date = new Date(run.started_at || run.created_at);
    const diffMs = now.getTime() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div
      className="hover:bg-muted/50 active:bg-muted flex cursor-pointer items-start gap-3 p-3 transition-colors"
      onClick={onClick}
    >
      {/* Status indicator */}
      <div
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg',
          style.bgColor
        )}
      >
        <StatusIcon className={cn('size-5', style.textColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top row: Name + Status badge */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="truncate leading-tight font-semibold">{run.name}</h3>
          <Badge
            className={cn(
              'shrink-0 gap-1 px-2 py-0.5 text-xs',
              style.bgColor,
              style.textColor
            )}
          >
            {getStatusLabel(run.status)}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span>
            {isToday
              ? getRelativeTime()
              : runDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                })}
          </span>
          {duration && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
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

        {/* Output summary */}
        {run.outputs_by_product_type &&
        run.outputs_by_product_type.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {run.outputs_by_product_type.map((output) => (
              <span
                key={output.product_type_id}
                className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
              >
                <span className="text-muted-foreground font-medium">
                  {output.product_type_code || output.product_type_name}:
                </span>
                <span className="font-semibold tabular-nums">
                  {output.total_quantity.toLocaleString()} kg
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic">
            No outputs recorded
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
    </div>
  );
}

// Date Group Section Component
function DateGroupSection({
  title,
  runs,
  onRunClick,
  getStatusLabel,
}: {
  title: string;
  runs: ProductionRunListItem[];
  onRunClick: (id: number) => void;
  getStatusLabel: (status: ProductionRunStatus) => string;
}) {
  if (runs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </h2>
        <span className="text-muted-foreground/60 text-xs">
          ({runs.length})
        </span>
      </div>
      <Card className="divide-y overflow-hidden border-0 shadow-sm">
        {runs.map((run) => (
          <RunCard
            key={run.id}
            run={run}
            onClick={() => onRunClick(run.id)}
            getStatusLabel={getStatusLabel}
          />
        ))}
      </Card>
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
  const groupedRuns = useMemo<GroupedRuns>(() => {
    if (!runsData?.data) {
      return {today: [], yesterday: [], thisWeek: [], earlier: []};
    }

    const groups: GroupedRuns = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    runsData.data.forEach((run) => {
      const group = getDateGroup(run.date || run.started_at || run.created_at);
      groups[group].push(run);
    });

    return groups;
  }, [runsData]);

  const hasAnyRuns =
    groupedRuns.today.length > 0 ||
    groupedRuns.yesterday.length > 0 ||
    groupedRuns.thisWeek.length > 0 ||
    groupedRuns.earlier.length > 0;

  const handleRunClick = (id: number) => {
    router.push(`/production-runs/${id}`);
  };

  return (
    <ProductionRunsGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-24">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
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

        <div className="container mx-auto space-y-4 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          )}

          {!isLoading && hasAnyRuns && (
            <div className="space-y-6">
              <DateGroupSection
                title={t('dateGroups.today')}
                runs={groupedRuns.today}
                onRunClick={handleRunClick}
                getStatusLabel={getStatusLabel}
              />
              <DateGroupSection
                title={t('dateGroups.yesterday')}
                runs={groupedRuns.yesterday}
                onRunClick={handleRunClick}
                getStatusLabel={getStatusLabel}
              />
              <DateGroupSection
                title={t('dateGroups.thisWeek')}
                runs={groupedRuns.thisWeek}
                onRunClick={handleRunClick}
                getStatusLabel={getStatusLabel}
              />
              <DateGroupSection
                title={t('dateGroups.earlier')}
                runs={groupedRuns.earlier}
                onRunClick={handleRunClick}
                getStatusLabel={getStatusLabel}
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !hasAnyRuns && (
            <Card className="border-0 shadow-md">
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
