'use client';

import {
  Zap,
  ClipboardList,
  ArrowRightLeft,
  Square,
  Settings2,
  User,
} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {RelativeTime} from '@/components/relative-time';

interface ProductionLine {
  id: number;
  name: string;
}

interface Shift {
  id: number;
  name: string;
  color: string;
}

interface ProductionRun {
  id: number;
  name: string;
  operator?: {name: string} | null;
  created_at: string;
  production_lines: ProductionLine[];
}

export interface ProductionRunCardProps {
  run: ProductionRun;
  currentShift?: Shift | null;
  currentOperator?: string | null;
  onRecordOutput?: () => void;
  onHandover?: () => void;
  onCompleteRun?: () => void;
  showRecordOutput?: boolean;
  showHandover?: boolean;
  showCompleteRun?: boolean;
  recordOutputLabel?: string;
  handoverLabel?: string;
  completeRunLabel?: string;
  /** Compact mode for grid layouts */
  compact?: boolean;
}

export function ProductionRunCard({
  run,
  currentShift,
  currentOperator,
  onRecordOutput,
  onHandover,
  onCompleteRun,
  showRecordOutput = true,
  showHandover = true,
  showCompleteRun = true,
  recordOutputLabel = 'Record Output',
  handoverLabel = 'Handover',
  completeRunLabel = 'Complete Run',
  compact = false,
}: ProductionRunCardProps) {
  const hasActions = showRecordOutput || showHandover || showCompleteRun;

  // Compact variant for grid layouts
  if (compact) {
    return (
      <Card className="flex h-full flex-col">
        <div className="flex flex-1 flex-col p-4">
          {/* Compact Header */}
          <div className="mb-2 flex items-center justify-between">
            <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
              <Zap className="text-foreground size-4" />
            </div>
            {currentShift && (
              <Badge
                style={{backgroundColor: currentShift.color}}
                className="text-xs text-white"
              >
                {currentShift.name}
              </Badge>
            )}
          </div>

          {/* Run Info */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold">{run.name}</h3>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <span className="relative flex size-1">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-1 rounded-full bg-emerald-500" />
                </span>
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {run.operator?.name}
            </p>
            <p className="text-muted-foreground text-xs">
              <RelativeTime date={run.created_at} />
            </p>
          </div>

          {/* Production Lines - Compact */}
          {run.production_lines.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {run.production_lines.slice(0, 2).map((line) => (
                <Badge
                  key={line.id}
                  variant="outline"
                  className="px-1.5 py-0.5 text-[10px] font-normal"
                >
                  <Settings2 className="me-1 size-2.5" />
                  {line.name}
                </Badge>
              ))}
              {run.production_lines.length > 2 && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0.5 text-[10px] font-normal"
                >
                  +{run.production_lines.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Compact Actions */}
        {hasActions && (
          <div className="p-2 pt-0">
            {showCompleteRun && onCompleteRun && (
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive w-full text-xs"
                onClick={onCompleteRun}
              >
                <Square className="me-1.5 size-3 shrink-0" />
                End Production
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Full variant (original)
  return (
    <Card>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
              <Zap className="text-foreground size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{run.name}</h3>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Active
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {run.operator?.name} • <RelativeTime date={run.created_at} />
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {currentShift && (
              <Badge
                style={{backgroundColor: currentShift.color}}
                className="text-white"
              >
                {currentShift.name}
              </Badge>
            )}
            {currentOperator && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <User className="size-3" />
                {currentOperator}
              </span>
            )}
          </div>
        </div>

        {/* Production Lines */}
        {run.production_lines.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {run.production_lines.map((line) => (
              <Badge key={line.id} variant="outline" className="font-normal">
                <Settings2 className="me-1 size-3" />
                {line.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {hasActions && (
        <div className="grid grid-cols-2 gap-2 border-t p-4">
          {showRecordOutput && onRecordOutput && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onRecordOutput}
            >
              <ClipboardList className="me-2 size-4 shrink-0" />
              <span className="truncate">{recordOutputLabel}</span>
            </Button>
          )}
          {showHandover && onHandover && (
            <Button variant="outline" className="w-full" onClick={onHandover}>
              <ArrowRightLeft className="me-2 size-4 shrink-0" />
              <span className="truncate">{handoverLabel}</span>
            </Button>
          )}
          {showCompleteRun && onCompleteRun && (
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive col-span-2 w-full"
              onClick={onCompleteRun}
            >
              <Square className="me-2 size-4 shrink-0" />
              <span className="truncate">{completeRunLabel}</span>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
