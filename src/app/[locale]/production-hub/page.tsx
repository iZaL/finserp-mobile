'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Factory,
  RefreshCw,
  ArrowLeft,
  ArrowRightLeft,
  Zap,
  ChevronRight,
  Loader2,
  ClipboardList,
  Play,
  Layers,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {Textarea} from '@/components/ui/textarea';
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
  useAcceptHandover,
  useCompleteRun,
} from '@/hooks/use-production-runs';
import {RelativeTime} from '@/components/relative-time';
import {cn} from '@/lib/utils';

export default function ProductionHubPage() {
  const router = useRouter();
  const t = useTranslations('productionHub');
  const tRuns = useTranslations('productionRuns');
  const permissions = usePermissions();

  const tCommon = useTranslations('common');

  const {
    data: dashboard,
    isLoading,
    refetch,
    isRefetching,
  } = useProductionDashboard();
  const acceptHandover = useAcceptHandover();
  const completeRun = useCompleteRun();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const hasActiveRun = !!dashboard?.active_run;
  const currentShift = dashboard?.current_shift;
  const activeRun = dashboard?.active_run;
  const pendingHandovers = dashboard?.pending_handovers || [];

  const handleAcceptHandover = async (id: number) => {
    await acceptHandover.mutateAsync(id);
  };

  const handleCompleteRun = async () => {
    if (!activeRun) return;

    await completeRun.mutateAsync({
      id: activeRun.id,
      completion_notes: completionNotes.trim() || undefined,
    });

    setShowCompleteDialog(false);
    setCompletionNotes('');
  };

  // Determine workflow state
  const getWorkflowState = () => {
    if (!hasActiveRun) return 'no_run';
    // For now, simple state based on active run
    return 'recording';
  };

  const workflowState = getWorkflowState();

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

        <div className="container mx-auto space-y-4 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          )}

          {!isLoading && (
            <>
              {/* Active Run Hero Card */}
              <Card className="overflow-hidden border-0 shadow-md">
                {hasActiveRun && activeRun ? (
                  <>
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
                    <CardContent className="p-3">
                      {activeRun.production_lines.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {activeRun.production_lines.map((line) => (
                            <div
                              key={line.id}
                              className="rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800"
                            >
                              <span className="text-sm font-medium">
                                {line.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
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
                              {tRuns('actions.recordOutput')}
                            </Button>
                          )}
                        {permissions.canCompleteProductionRun() && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowCompleteDialog(true)}
                          >
                            {tRuns('actions.completeRun')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted flex size-12 items-center justify-center rounded-xl">
                        <Factory className="text-muted-foreground size-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{t('noActiveRun')}</p>
                        <p className="text-muted-foreground text-sm">
                          {t('startRunPrompt')}
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
                    </div>
                    {permissions.canCreateProductionRun() && (
                      <Button
                        className="mt-3 w-full bg-gradient-to-r from-emerald-500 to-green-600"
                        onClick={() => router.push('/production-runs/new')}
                      >
                        <Play className="me-2 size-4" />
                        {tRuns('actions.startRun')}
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Pending Handovers */}
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
                            tRuns('handover.accept')
                          )}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Shift Handover Action */}
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
                          {tRuns('shift.shiftHandover')}
                        </span>
                        {currentShift && (
                          <p className="text-muted-foreground text-xs">
                            {tRuns('shift.handoverFrom', {
                              shift: currentShift.name,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>
                )}

              {/* Quick Navigation Links */}
              <div className="space-y-2">
                <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
                  {tRuns('list.title')}
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/production-runs')}
                    className="bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <Play className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm font-medium">
                        {tRuns('title')}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>

                  <button
                    onClick={() => router.push('/production-outputs')}
                    className="bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <ClipboardList className="size-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium">
                        {tRuns('outputsTitle')}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>

                  <button
                    onClick={() => router.push('/batches')}
                    className="bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                        <Layers className="size-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('batches')}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>

                  <button
                    onClick={() => router.push('/batches/transfer')}
                    className="bg-card hover:bg-muted/50 flex w-full items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <ArrowRightLeft className="size-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-sm font-medium">
                        {t('transferStock')}
                      </span>
                    </div>
                    <ChevronRight className="text-muted-foreground size-4" />
                  </button>
                </div>
              </div>
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
            <AlertDialogTitle>{tRuns('dialog.completeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tRuns('dialog.completeDescription', {
                name: activeRun?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={tRuns('dialog.completionNotesPlaceholder')}
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
                  {tRuns('dialog.completing')}
                </>
              ) : (
                tRuns('dialog.completeButton')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProductionRunsGuard>
  );
}
