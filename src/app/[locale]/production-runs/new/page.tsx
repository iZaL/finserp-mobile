'use client';

import {useState, useEffect, useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  ArrowLeft,
  Factory,
  Loader2,
  Play,
  User,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {ProductionRunsGuard} from '@/components/permission-guard';
import {OperatorSelector} from '@/components/operator-selector';
import {useRunFormData, useCreateRun} from '@/hooks/use-production-runs';
import type {ProductionLineEntry, Operator} from '@/types/production-run';

interface LineSelection {
  selected: boolean;
  plannedCapacity: number;
}

export default function NewProductionRunPage() {
  const router = useRouter();
  const t = useTranslations('productionRuns');
  const tCommon = useTranslations('common');

  const {data: formData, isLoading, error} = useRunFormData();
  const createRunMutation = useCreateRun();

  const [runName, setRunName] = useState('');
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [startImmediately, setStartImmediately] = useState(true);
  const [lineSelections, setLineSelections] = useState<
    Record<number, LineSelection>
  >({});

  // Initialize line selections when form data loads
  useEffect(() => {
    if (formData?.production_lines) {
      const initialSelections: Record<number, LineSelection> = {};
      formData.production_lines.forEach((line) => {
        initialSelections[line.id] = {
          selected: true, // Pre-select all active lines
          plannedCapacity: line.max_capacity || 0, // Pre-fill with max capacity
        };
      });
      setLineSelections(initialSelections);
    }
    if (formData?.suggested_name) {
      setRunName(formData.suggested_name);
    }
  }, [formData]);

  // Selected lines count
  const selectedLinesCount = useMemo(() => {
    return Object.values(lineSelections).filter((l) => l.selected).length;
  }, [lineSelections]);

  // Total planned capacity
  const totalPlannedCapacity = useMemo(() => {
    return Object.entries(lineSelections)
      .filter(([, l]) => l.selected)
      .reduce((sum, [, l]) => sum + (l.plannedCapacity || 0), 0);
  }, [lineSelections]);

  const toggleLineSelection = (lineId: number) => {
    setLineSelections((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        selected: !prev[lineId]?.selected,
      },
    }));
  };

  const updateLineCapacity = (lineId: number, capacity: number) => {
    setLineSelections((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        plannedCapacity: Math.max(0, capacity),
      },
    }));
  };

  const handleSubmit = async () => {
    if (!operatorId || selectedLinesCount === 0) return;

    const productionLines: ProductionLineEntry[] = Object.entries(
      lineSelections
    )
      .filter(([, l]) => l.selected)
      .map(([id, l]) => ({
        production_line_id: parseInt(id),
        planned_capacity: l.plannedCapacity,
      }));

    try {
      await createRunMutation.mutateAsync({
        name:
          runName ||
          formData?.suggested_name ||
          `Run ${new Date().toISOString()}`,
        operator_id: operatorId,
        production_lines: productionLines,
        start_immediately: startImmediately,
      });
      router.push('/production-runs');
    } catch {
      // Error is handled by mutation
    }
  };

  const canSubmit =
    operatorId !== null &&
    selectedLinesCount > 0 &&
    !createRunMutation.isPending;

  if (isLoading) {
    return (
      <ProductionRunsGuard>
        <div className="container mx-auto space-y-6 p-4 pb-20">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </ProductionRunsGuard>
    );
  }

  if (error) {
    return (
      <ProductionRunsGuard>
        <div className="container mx-auto space-y-6 p-4 pb-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t('new.title')}</h1>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{t('new.failedToLoad')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {tCommon('retry')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProductionRunsGuard>
    );
  }

  return (
    <ProductionRunsGuard>
      <div className="container mx-auto space-y-4 p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('new.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('new.subtitle')}</p>
          </div>
        </div>

        {/* Run Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="size-4 text-amber-600" />
              {t('new.runName')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder={t('new.runNamePlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Operator Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-blue-600" />
              {t('new.selectOperator')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OperatorSelector
              operators={formData?.operators || []}
              selectedOperatorId={operatorId}
              onSelect={(operator: Operator | null) =>
                setOperatorId(operator?.id || null)
              }
              placeholder={t('new.selectOperatorPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Production Lines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('new.selectProductionLine')}
              <span className="text-muted-foreground ms-2 text-sm font-normal">
                ({t('new.linesSelected', {count: selectedLinesCount})})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData?.production_lines.map((line) => {
              const selection = lineSelections[line.id] || {
                selected: false,
                plannedCapacity: 0,
              };
              return (
                <div
                  key={line.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors',
                    selection.selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border opacity-60'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleLineSelection(line.id)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          'flex size-5 items-center justify-center rounded border-2',
                          selection.selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {selection.selected && <Check className="size-3" />}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{line.name}</p>
                        {line.description && (
                          <p className="text-muted-foreground text-xs">
                            {line.description}
                          </p>
                        )}
                      </div>
                    </button>
                    <span className="text-muted-foreground text-xs">
                      {t('new.maxCapacity', {
                        capacity: line.max_capacity?.toLocaleString() || 0,
                      })}
                    </span>
                  </div>

                  {selection.selected && (
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">
                        {t('new.plannedCapacity')}:
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() =>
                            updateLineCapacity(
                              line.id,
                              (selection.plannedCapacity || 0) - 100
                            )
                          }
                        >
                          <Minus className="size-3" />
                        </Button>
                        <Input
                          type="number"
                          value={selection.plannedCapacity || ''}
                          onChange={(e) =>
                            updateLineCapacity(
                              line.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 w-24 text-center text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() =>
                            updateLineCapacity(
                              line.id,
                              (selection.plannedCapacity || 0) + 100
                            )
                          }
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() =>
                          updateLineCapacity(line.id, line.max_capacity || 0)
                        }
                      >
                        {t('new.max')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Start Immediately Option */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('actions.startRun')}</p>
                <p className="text-muted-foreground text-sm">
                  {t('new.startImmediatelyDescription')}
                </p>
              </div>
              <Switch
                checked={startImmediately}
                onCheckedChange={setStartImmediately}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedLinesCount > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="mb-1 flex justify-between">
              <span className="text-muted-foreground">
                {t('new.summaryLines')}:
              </span>
              <span className="font-medium">{selectedLinesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('new.summaryCapacity')}:
              </span>
              <span className="font-medium">
                {totalPlannedCapacity.toLocaleString()} kg
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-background fixed right-0 bottom-0 left-0 border-t p-4">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 w-full text-base"
          >
            {createRunMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('new.starting')}
              </>
            ) : (
              <>
                <Play className="mr-2 size-5" />
                {t('new.startButton')}
              </>
            )}
          </Button>
        </div>
      </div>
    </ProductionRunsGuard>
  );
}
