'use client';

import {useState, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {ArrowLeft, Factory, Loader2, Play, User, Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {ProductionRunsGuard} from '@/components/permission-guard';
import {OperatorSelector} from '@/components/operator-selector';
import {useRunFormData, useCreateRun} from '@/hooks/use-production-runs';
import type {ProductionLineEntry, Operator} from '@/types/production-run';

export default function NewProductionRunPage() {
  const router = useRouter();
  const t = useTranslations('productionRuns');
  const tCommon = useTranslations('common');

  const {data: formData, isLoading, error} = useRunFormData();
  const createRunMutation = useCreateRun();

  const [runName, setRunName] = useState('');
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<number>>(
    new Set()
  );

  // Check if there's only one production line
  const hasOnlyOneLine = formData?.production_lines?.length === 1;

  // Initialize selections when form data loads
  useEffect(() => {
    if (formData?.production_lines) {
      // Pre-select all lines
      setSelectedLineIds(new Set(formData.production_lines.map((l) => l.id)));
    }
    if (formData?.suggested_name) {
      setRunName(formData.suggested_name);
    }
  }, [formData]);

  // Selected lines count
  const selectedLinesCount = selectedLineIds.size;

  const toggleLineSelection = (lineId: number) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!operatorId || selectedLinesCount === 0) return;

    const productionLines: ProductionLineEntry[] = Array.from(
      selectedLineIds
    ).map((id) => {
      const line = formData?.production_lines.find((l) => l.id === id);
      return {
        production_line_id: id,
        planned_capacity: line?.max_capacity || 0,
      };
    });

    try {
      await createRunMutation.mutateAsync({
        name:
          runName ||
          formData?.suggested_name ||
          `Run ${new Date().toISOString()}`,
        operator_id: operatorId,
        production_lines: productionLines,
        start_immediately: true, // Always start immediately
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

        {/* Production Lines - only show if more than one */}
        {!hasOnlyOneLine && formData?.production_lines && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t('new.selectProductionLine')}
                <span className="text-muted-foreground ms-2 text-sm font-normal">
                  ({t('new.linesSelected', {count: selectedLinesCount})})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.production_lines.map((line) => {
                const isSelected = selectedLineIds.has(line.id);
                return (
                  <button
                    key={line.id}
                    onClick={() => toggleLineSelection(line.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded border-2',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                      {line.description && (
                        <p className="text-muted-foreground truncate text-xs">
                          {line.description}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {t('new.maxCapacity', {
                        capacity: line.max_capacity?.toLocaleString() || 0,
                      })}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Show selected line info when only one line exists */}
        {hasOnlyOneLine && formData?.production_lines?.[0] && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <Factory className="text-primary size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {formData.production_lines[0].name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('new.maxCapacity', {
                      capacity:
                        formData.production_lines[0].max_capacity?.toLocaleString() ||
                        0,
                    })}
                  </p>
                </div>
                <Check className="text-primary size-5" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fixed Submit Button */}
        <div className="bg-background border-border fixed right-0 bottom-0 left-0 z-40 border-t px-4 pt-4 pb-20 shadow-lg">
          <div className="mx-auto max-w-2xl">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-12 w-full text-base"
              size="lg"
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
      </div>
    </ProductionRunsGuard>
  );
}
