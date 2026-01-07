'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Factory,
  RefreshCw,
  ArrowLeft,
  ArrowRightLeft,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {ProductionRunsGuard} from '@/components/permission-guard';
import {usePermissions} from '@/lib/stores/permission-store';
import {
  useProductionDashboard,
  useAcceptHandover,
  useCompleteRun,
  useHandoverFormData,
  useCreateHandover,
  useOperators,
} from '@/hooks/use-production-runs';
import {RelativeTime} from '@/components/relative-time';
import {ProductionRunCard} from '@/components/production-run-card';
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
  const {data: handoverFormData} = useHandoverFormData();
  const createHandover = useCreateHandover();
  const {data: operators} = useOperators();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [fromShift, setFromShift] = useState('');
  const [toShift, setToShift] = useState('');
  const [toOperatorId, setToOperatorId] = useState<string>('');

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

  const handleHandover = async () => {
    if (!fromShift || !toShift) return;

    try {
      // Create handover and auto-accept
      const result = await createHandover.mutateAsync({
        from_shift: fromShift,
        to_shift: toShift,
        ...(toOperatorId ? {to_user_id: Number(toOperatorId)} : {}),
      });

      // Auto-accept the handover
      if (result?.id) {
        try {
          await acceptHandover.mutateAsync(result.id);
        } catch {
          // If auto-accept fails, handover is still created
          // User can manually accept later
        }
      }

      setShowHandoverDialog(false);
      setFromShift('');
      setToShift('');
      setToOperatorId('');
    } catch {
      // Error handled by mutation hook
    }
  };

  // Get current operator from dashboard (updates after handovers)
  const currentOperator = dashboard?.current_operator;
  const currentOperatorName =
    currentOperator?.name || activeRun?.operator?.name;

  // Set default shifts when dialog opens
  const openHandoverDialog = () => {
    if (handoverFormData?.current_shift) {
      setFromShift(handoverFormData.current_shift.name);
    }
    if (handoverFormData?.next_shift) {
      setToShift(handoverFormData.next_shift.name);
    }
    setShowHandoverDialog(true);
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
              {hasActiveRun && activeRun ? (
                <ProductionRunCard
                  run={activeRun}
                  currentShift={currentShift}
                  currentOperator={currentOperatorName}
                  onRecordOutput={
                    permissions.canCreateProductionOutput() && currentShift
                      ? () =>
                          router.push(
                            `/production-outputs/new?run_id=${activeRun.id}&shift_id=${currentShift.id}`
                          )
                      : undefined
                  }
                  onHandover={
                    permissions.canHandoverShift()
                      ? openHandoverDialog
                      : undefined
                  }
                  onCompleteRun={
                    permissions.canCompleteProductionRun()
                      ? () => setShowCompleteDialog(true)
                      : undefined
                  }
                  showRecordOutput={
                    permissions.canCreateProductionOutput() && !!currentShift
                  }
                  showHandover={permissions.canHandoverShift()}
                  showCompleteRun={permissions.canCompleteProductionRun()}
                  recordOutputLabel={tRuns('actions.recordOutput')}
                  handoverLabel={tRuns('shift.shiftHandover')}
                  completeRunLabel={tRuns('actions.completeRun')}
                />
              ) : (
                <Card>
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
                    <div className="mt-3 flex gap-2">
                      {permissions.canCreateProductionRun() && (
                        <Button
                          className="flex-1"
                          onClick={() => router.push('/production-runs/new')}
                        >
                          <Play className="me-2 size-4" />
                          {tRuns('actions.startRun')}
                        </Button>
                      )}
                      {permissions.canHandoverShift() && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={openHandoverDialog}
                        >
                          <ArrowRightLeft className="me-2 size-4" />
                          {tRuns('shift.shiftHandover')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tRuns('shift.shiftHandover')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Simple two-shift UI */}
            {handoverFormData?.shifts &&
            handoverFormData.shifts.length === 2 ? (
              <>
                {/* Visual handover flow - compact for 2 shifts */}
                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <Badge
                        className="px-4 py-1.5 text-base"
                        style={{
                          backgroundColor:
                            handoverFormData?.shifts.find(
                              (s) => s.name === fromShift
                            )?.color || '#888',
                          color: 'white',
                        }}
                      >
                        {fromShift}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowRightLeft className="text-muted-foreground size-6" />
                    </div>
                    <div className="text-center">
                      <Badge
                        className="px-4 py-1.5 text-base"
                        style={{
                          backgroundColor:
                            handoverFormData?.shifts.find(
                              (s) => s.name === toShift
                            )?.color || '#888',
                          color: 'white',
                        }}
                      >
                        {toShift}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Operator selection */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    {tRuns('handover.toOperator')} ({tCommon('optional')})
                  </Label>
                  <Select value={toOperatorId} onValueChange={setToOperatorId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tRuns('handover.selectOperator')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {operators?.operators?.map((operator) => (
                        <SelectItem
                          key={operator.id}
                          value={String(operator.id)}
                        >
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                {/* Multi-shift UI */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-1 text-xs">
                        {tRuns('handover.fromShift')}
                      </p>
                      <Badge
                        className="px-3 py-1 text-sm"
                        style={{
                          backgroundColor:
                            handoverFormData?.shifts.find(
                              (s) => s.name === fromShift
                            )?.color || '#888',
                          color: 'white',
                        }}
                      >
                        {fromShift || '—'}
                      </Badge>
                    </div>
                    <ArrowRightLeft className="text-muted-foreground size-5" />
                    <div className="text-center">
                      <p className="text-muted-foreground mb-1 text-xs">
                        {tRuns('handover.toShift')}
                      </p>
                      <Badge
                        className="px-3 py-1 text-sm"
                        style={{
                          backgroundColor:
                            handoverFormData?.shifts.find(
                              (s) => s.name === toShift
                            )?.color || '#888',
                          color: 'white',
                        }}
                      >
                        {toShift || '—'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Target shift selection */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    {tRuns('handover.handingOverTo')}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {handoverFormData?.shifts
                      .filter((shift) => shift.name !== fromShift)
                      .map((shift) => (
                        <button
                          key={shift.id}
                          type="button"
                          onClick={() => setToShift(shift.name)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all',
                            toShift === shift.name
                              ? 'border-primary bg-primary/10 ring-primary/20 ring-2'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <div
                            className="size-3 rounded-full"
                            style={{backgroundColor: shift.color}}
                          />
                          <span className="font-medium">{shift.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Operator selection */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">
                    {tRuns('handover.toOperator')} ({tCommon('optional')})
                  </Label>
                  <Select value={toOperatorId} onValueChange={setToOperatorId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tRuns('handover.selectOperator')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {operators?.operators?.map((operator) => (
                        <SelectItem
                          key={operator.id}
                          value={String(operator.id)}
                        >
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={handleHandover}
              disabled={!fromShift || !toShift || createHandover.isPending}
            >
              {createHandover.isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {tRuns('handover.submitting')}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="me-2 size-4" />
                  {tRuns('handover.submitButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProductionRunsGuard>
  );
}
