'use client';

import {useState} from 'react';
import {cn} from '@/lib/utils';
import {formatWeightCompact} from '@/lib/utils/weight';
import {format, parseISO, differenceInMinutes} from 'date-fns';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import type {ProductionRunListItem} from '@/types/production-run';
import {
  ChevronDown,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Timer,
  Layers,
} from 'lucide-react';

interface RunCardExpandableProps {
  run: ProductionRunListItem;
  className?: string;
}

function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative" style={{width: size, height: size}}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 100 ? '#10b981' : '#3b82f6'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">
          {Math.min(Math.round(value), 100)}%
        </span>
      </div>
    </div>
  );
}

const statusConfig = {
  planned: {
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    label: 'Planned',
  },
  in_progress: {
    icon: Play,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    label: 'In Progress',
  },
  completed: {
    icon: CheckCircle,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    label: 'Completed',
  },
  canceled: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    label: 'Canceled',
  },
};

export function RunCardExpandable({run, className}: RunCardExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const status = statusConfig[run.status] || statusConfig.planned;
  const StatusIcon = status.icon;

  const progressPercent =
    run.total_planned > 0 ? (run.total_actual / run.total_planned) * 100 : 0;

  // Calculate duration
  const duration =
    run.started_at && run.completed_at
      ? differenceInMinutes(
          parseISO(run.completed_at),
          parseISO(run.started_at)
        )
      : run.started_at
        ? differenceInMinutes(new Date(), parseISO(run.started_at))
        : 0;

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Card className={cn('overflow-hidden transition-all', className)}>
      <CardContent className="p-0">
        {/* Collapsed view - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          {/* Progress ring */}
          <CircularProgress value={progressPercent} />

          {/* Run info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-semibold">{run.name}</h4>
              <Badge variant="outline" className={cn('text-xs', status.color)}>
                <StatusIcon className="mr-1 size-3" />
                {status.label}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
              {run.operator && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {run.operator.name}
                </span>
              )}
              {duration > 0 && (
                <span className="flex items-center gap-1">
                  <Timer className="size-3" />
                  {durationText}
                </span>
              )}
              {run.lines_count > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="size-3" />
                  {run.lines_count} line{run.lines_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Expand icon */}
          <ChevronDown
            className={cn(
              'text-muted-foreground size-5 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>

        {/* Expanded view */}
        {isExpanded && (
          <div className="border-t px-4 pt-3 pb-4">
            {/* Output summary */}
            {run.outputs_by_product_type &&
              run.outputs_by_product_type.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-muted-foreground mb-2 text-xs font-medium">
                    Production Output
                  </h5>
                  <div className="space-y-2">
                    {run.outputs_by_product_type.map((output, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
                      >
                        <span className="text-sm">
                          {output.product_type_name}
                        </span>
                        <span className="font-semibold">
                          {formatWeightCompact(output.total_quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Production lines */}
            {run.lines && run.lines.length > 0 && (
              <div className="mb-4">
                <h5 className="text-muted-foreground mb-2 text-xs font-medium">
                  Production Lines
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {run.lines.map((line) => (
                    <Badge
                      key={line.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {line.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h5 className="text-muted-foreground mb-2 text-xs font-medium">
                Timeline
              </h5>
              <div className="space-y-1.5 text-sm">
                {run.started_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span>{format(parseISO(run.started_at), 'HH:mm')}</span>
                  </div>
                )}
                {run.completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{format(parseISO(run.completed_at), 'HH:mm')}</span>
                  </div>
                )}
                {duration > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{durationText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span>
                  {formatWeightCompact(run.total_actual * 1000)} /{' '}
                  {formatWeightCompact(run.total_planned * 1000)}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
