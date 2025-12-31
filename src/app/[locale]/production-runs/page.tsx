'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Plus,
  Square,
  ArrowRightLeft,
  Factory,
  Loader2,
  RefreshCw,
  ClipboardList,
  ArrowLeft,
  ChevronRight,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Textarea} from '@/components/ui/textarea';
import {Skeleton} from '@/components/ui/skeleton';
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
import {ProductionRunsGuard} from '@/components/permission-guard';
import {usePermissions} from '@/lib/stores/permission-store';
import {
  useProductionDashboard,
  useCompleteRun,
  useAcceptHandover,
  useProductionRuns,
} from '@/hooks/use-production-runs';
import {RelativeTime} from '@/components/relative-time';
import {cn} from '@/lib/utils';
import type {ProductionRunStatus} from '@/types/production-run';

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

export default function ProductionRunsPage() {
  const router = useRouter();
  const t = useTranslations('productionRuns');
  const tCommon = useTranslations('common');
  const permissions = usePermissions();

  const {
    data: dashboard,
    isLoading,
    refetch,
    isRefetching,
  } = useProductionDashboard();
  const completeRun = useCompleteRun();
  const acceptHandover = useAcceptHandover();
  const {data: runsData} = useProductionRuns({per_page: 10});

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const hasActiveRun = !!dashboard?.active_run;
  const currentShift = dashboard?.current_shift;
  const activeRun = dashboard?.active_run;
  const pendingHandovers = dashboard?.pending_handovers || [];

  const handleCompleteRun = async () => {
    if (!activeRun) return;

    await completeRun.mutateAsync({
      id: activeRun.id,
      completion_notes: completionNotes.trim() || undefined,
    });

    setShowCompleteDialog(false);
    setCompletionNotes('');
  };

  const handleAcceptHandover = async (id: number) => {
    await acceptHandover.mutateAsync(id);
  };

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
                onClick={() => router.push('/')}
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
                  className="bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm"
                >
                  <Plus className="me-1 size-4" />
                  {t('createNew')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto space-y-3 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Active Run Card - Compact Hero */}
              <Card className="overflow-hidden border-0 shadow-md">
                {hasActiveRun && activeRun ? (
                  <>
                    {/* Compact header with shift badge */}
                    <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-3 text-white">
                      <div className="absolute -top-3 -right-3 size-12 rounded-full bg-white/10" />

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="size-5" />
                          <div>
                            <p className="text-lg leading-tight font-bold">
                              {activeRun.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/80">
                              {activeRun.operator && (
                                <span>{activeRun.operator.name}</span>
                              )}
                              <span>•</span>
                              <RelativeTime date={activeRun.created_at} />
                            </div>
                          </div>
                        </div>

                        {/* Shift badge */}
                        {currentShift && (
                          <div
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{backgroundColor: currentShift.color}}
                          >
                            {currentShift.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Production lines - compact */}
                    <CardContent className="p-3">
                      {activeRun.production_lines.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {activeRun.production_lines.map((line) => {
                            const progress =
                              line.planned_capacity > 0
                                ? ((line.actual_production || 0) /
                                    line.planned_capacity) *
                                  100
                                : 0;
                            return (
                              <div key={line.id}>
                                <div className="mb-1 flex items-center justify-between text-sm">
                                  <span className="font-medium">
                                    {line.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs tabular-nums">
                                    {(
                                      line.actual_production || 0
                                    ).toLocaleString()}{' '}
                                    / {line.planned_capacity.toLocaleString()}{' '}
                                    kg
                                  </span>
                                </div>
                                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                                    style={{
                                      width: `${Math.min(progress, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Compact action buttons */}
                      <div className="flex gap-2">
                        {permissions.canCreateProductionOutput() &&
                          currentShift && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                router.push(
                                  `/production-outputs/new?run_id=${activeRun.id}&shift_id=${currentShift.id}`
                                )
                              }
                            >
                              <ClipboardList className="me-1.5 size-4" />
                              {t('actions.recordOutput')}
                            </Button>
                          )}
                        {permissions.canCompleteProductionRun() && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowCompleteDialog(true)}
                          >
                            <Square className="me-1.5 size-4" />
                            {t('actions.completeRun')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  /* No active run - minimal */
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                      <Factory className="text-muted-foreground size-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{t('noActiveRun')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('noActiveRunDescription')}
                      </p>
                    </div>
                    {currentShift && (
                      <Badge
                        style={{backgroundColor: currentShift.color}}
                        className="text-white"
                      >
                        {currentShift.name}
                      </Badge>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Pending Handovers - Compact alert style */}
              {pendingHandovers.length > 0 && (
                <Card className="border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30">
                  <CardContent className="p-3">
                    {pendingHandovers.map((handover) => (
                      <div
                        key={handover.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="size-4 text-violet-600 dark:text-violet-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {handover.from_shift} → {handover.to_shift}
                            </p>
                            <RelativeTime
                              date={handover.created_at}
                              className="text-muted-foreground text-xs"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptHandover(handover.id)}
                          disabled={acceptHandover.isPending}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {acceptHandover.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t('handover.accept')
                          )}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Handover action - Simple row when no pending */}
              {permissions.canHandoverShift() &&
                pendingHandovers.length === 0 && (
                  <button
                    onClick={() => router.push('/production-runs/handover')}
                    className="bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <ArrowRightLeft className="size-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          {t('shift.shiftHandover')}
                        </span>
                        {currentShift && (
                          <p className="text-muted-foreground text-xs">
                            {t('shift.handoverFrom', {
                              shift: currentShift.name,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>
                )}

              {/* Recent Production Runs - Simple list */}
              {runsData && runsData.data.length > 0 && (
                <div>
                  <h2 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">
                    {t('list.title')}
                  </h2>
                  <Card className="divide-y overflow-hidden border-0 shadow-sm">
                    {runsData.data
                      .filter((run) => !activeRun || run.id !== activeRun.id)
                      .map((run) => {
                        const style = getStatusStyle(run.status);
                        const StatusIcon = style.icon;
                        const runDate = new Date(
                          run.date || run.started_at || run.created_at
                        );

                        // Calculate duration
                        const getDuration = () => {
                          if (!run.started_at) return null;
                          const start = new Date(run.started_at);
                          const end = run.completed_at
                            ? new Date(run.completed_at)
                            : new Date();
                          const diffMs = end.getTime() - start.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor(
                            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                          );
                          if (hours > 0) return `${hours}h ${minutes}m`;
                          return `${minutes}m`;
                        };
                        const duration = getDuration();

                        return (
                          <div
                            key={run.id}
                            className="hover:bg-muted/50 active:bg-muted cursor-pointer p-3 transition-colors"
                            onClick={() =>
                              router.push(`/production-runs/${run.id}`)
                            }
                          >
                            {/* Top row: Name + Status */}
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <h3 className="truncate font-semibold">
                                {run.name}
                              </h3>
                              <Badge
                                className={cn(
                                  'shrink-0 gap-1 px-2 py-0.5 text-xs',
                                  style.bgColor,
                                  style.textColor
                                )}
                              >
                                <StatusIcon className="size-3" />
                                {getStatusLabel(run.status)}
                              </Badge>
                            </div>

                            {/* Meta row: Date, Duration, Operator */}
                            <div className="text-muted-foreground mb-2 flex items-center gap-3 text-xs">
                              <span>
                                {runDate.toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {duration && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    <span>{duration}</span>
                                  </div>
                                </>
                              )}
                              {run.operator && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    {run.operator.name}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Product type outputs */}
                            {run.outputs_by_product_type &&
                            run.outputs_by_product_type.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {run.outputs_by_product_type.map((output) => (
                                  <span
                                    key={output.product_type_id}
                                    className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {output.product_type_code ||
                                        output.product_type_name}
                                      :
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                      {output.total_quantity.toLocaleString()}{' '}
                                      kg
                                    </span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                No outputs recorded
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Complete Run Confirmation Dialog */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.completeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.completeDescription', {name: activeRun?.name ?? ''})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t('dialog.completionNotesPlaceholder')}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completeRun.isPending}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteRun}
              disabled={completeRun.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {completeRun.isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t('dialog.completing')}
                </>
              ) : (
                t('dialog.completeButton')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProductionRunsGuard>
  );
}
