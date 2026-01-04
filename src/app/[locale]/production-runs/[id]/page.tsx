'use client';

import {useParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  User,
  Factory,
  ClipboardList,
  Square,
  Loader2,
  RefreshCw,
  Play,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
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
  useProductionRun,
  useCompleteRun,
  useStartRun,
} from '@/hooks/use-production-runs';
import {RelativeTime} from '@/components/relative-time';
import {ProductionOutputsTable} from '@/components/production-outputs-table';
import {useState} from 'react';
import {cn} from '@/lib/utils';

// Status styling helper
function getStatusStyle(status: string) {
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

export default function ProductionRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('productionRuns');
  const permissions = usePermissions();

  const runId = params.id ? parseInt(params.id as string, 10) : null;
  const {data, isLoading, refetch, isRefetching} = useProductionRun(runId);
  const completeRun = useCompleteRun();
  const startRun = useStartRun();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const run = data?.run;

  const handleCompleteRun = async () => {
    if (!run) return;

    await completeRun.mutateAsync({
      id: run.id,
      completion_notes: completionNotes.trim() || undefined,
    });

    setShowCompleteDialog(false);
    setCompletionNotes('');
  };

  const handleStartRun = async () => {
    if (!run) return;
    await startRun.mutateAsync({id: run.id});
  };

  const getStatusLabel = (status: string) => {
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

  const style = run ? getStatusStyle(run.status) : getStatusStyle('planned');
  const StatusIcon = style.icon;

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
                onClick={() => router.push('/production-runs')}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold">
                  {run?.name || t('title')}
                </h1>
                <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
              </div>
            </div>
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
          </div>
        </div>

        <div className="container mx-auto space-y-3 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          )}

          {!isLoading && run && (
            <>
              {/* Hero Card */}
              <Card className="overflow-hidden border-0 shadow-md">
                {/* Header with status gradient */}
                <div
                  className={cn(
                    'relative overflow-hidden rounded-t-xl bg-gradient-to-br px-4 py-3 text-white',
                    style.gradient
                  )}
                >
                  <div className="absolute -top-3 -right-3 size-12 rounded-full bg-white/10" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="size-5" />
                      <div>
                        <p className="text-lg leading-tight font-bold">
                          {run.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/80">
                          <Calendar className="size-3" />
                          <span>
                            {new Date(run.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>{getStatusLabel(run.status)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shift badge */}
                    {run.shift && (
                      <div
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{backgroundColor: run.shift.color}}
                      >
                        {run.shift.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-3">
                  {/* Info grid */}
                  <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {run.operator && (
                      <>
                        <span className="text-muted-foreground">Operator</span>
                        <span className="text-right font-medium">
                          {run.operator.name}
                        </span>
                      </>
                    )}
                    {run.shift && (
                      <>
                        <span className="text-muted-foreground">
                          Shift Time
                        </span>
                        <span className="text-right">
                          {run.shift.start_time} - {run.shift.end_time}
                        </span>
                      </>
                    )}
                    {run.started_at && (
                      <>
                        <span className="text-muted-foreground">
                          {t('detail.started')}
                        </span>
                        <RelativeTime
                          date={run.started_at}
                          className="text-right"
                        />
                      </>
                    )}
                    {run.completed_at && (
                      <>
                        <span className="text-muted-foreground">
                          {t('detail.completed')}
                        </span>
                        <RelativeTime
                          date={run.completed_at}
                          className="text-right"
                        />
                      </>
                    )}
                    {!run.started_at && !run.completed_at && (
                      <>
                        <span className="text-muted-foreground">
                          {t('detail.created')}
                        </span>
                        <RelativeTime
                          date={run.created_at}
                          className="text-right"
                        />
                      </>
                    )}
                  </div>

                  {/* Production Lines */}
                  {run.production_lines.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                        {t('detail.productionLines')}
                      </p>
                      <div className="space-y-2">
                        {run.production_lines.map((line) => {
                          const progress =
                            line.planned_capacity > 0
                              ? ((line.actual_production || 0) /
                                  line.planned_capacity) *
                                100
                              : 0;
                          return (
                            <div key={line.id}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-medium">{line.name}</span>
                                <span className="text-muted-foreground text-xs tabular-nums">
                                  {(
                                    line.actual_production || 0
                                  ).toLocaleString()}{' '}
                                  / {line.planned_capacity.toLocaleString()} kg
                                </span>
                              </div>
                              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                <div
                                  className={cn(
                                    'h-full rounded-full bg-gradient-to-r',
                                    style.gradient
                                  )}
                                  style={{width: `${Math.min(progress, 100)}%`}}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {run.production_lines.length > 1 && (
                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                          <span className="font-semibold">
                            {t('detail.total')}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {run.total_actual.toLocaleString()} /{' '}
                            {run.total_planned.toLocaleString()} kg
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {run.notes && (
                    <div className="mt-3 border-t pt-3">
                      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                        <FileText className="size-3" />
                        <span>{t('detail.notes')}</span>
                      </div>
                      <p className="text-sm">{run.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {run.status === 'planned' &&
                    permissions.canStartProductionRun() && (
                      <Button
                        className={cn(
                          'mt-3 w-full bg-gradient-to-r',
                          style.gradient
                        )}
                        onClick={handleStartRun}
                        disabled={startRun.isPending}
                      >
                        {startRun.isPending ? (
                          <Loader2 className="me-2 size-4 animate-spin" />
                        ) : (
                          <Play className="me-2 size-4" />
                        )}
                        {t('actions.startRun')}
                      </Button>
                    )}

                  {(run.status === 'in_progress' ||
                    run.status === 'completed') && (
                    <div className="mt-3 flex gap-2">
                      {permissions.canCreateProductionOutput() && run.shift && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(
                              `/production-outputs/new?run_id=${run.id}&shift_id=${run.shift!.id}`
                            )
                          }
                        >
                          <ClipboardList className="me-1.5 size-4" />
                          {t('actions.recordOutput')}
                        </Button>
                      )}
                      {run.status === 'in_progress' &&
                        permissions.canCompleteProductionRun() && (
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
                  )}
                </CardContent>
              </Card>

              {/* Production Outputs Section */}
              <div>
                <h2 className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">
                  {t('outputs.title')}
                </h2>
                <ProductionOutputsTable
                  filters={{production_run_id: run.id}}
                  showBatchingCard={true}
                  showEmptyState={true}
                  compact={true}
                  onlyBatchable={true}
                />
              </div>
            </>
          )}

          {/* Not Found State */}
          {!isLoading && !run && (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Factory className="text-muted-foreground mx-auto mb-3 size-12 opacity-50" />
                <h3 className="mb-1 font-semibold">Run Not Found</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  The production run you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/production-runs')}
                >
                  <ArrowLeft className="me-2 size-4" />
                  Back to Production Runs
                </Button>
              </CardContent>
            </Card>
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
              {t('dialog.completeDescription', {name: run?.name ?? ''})}
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
              Cancel
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
