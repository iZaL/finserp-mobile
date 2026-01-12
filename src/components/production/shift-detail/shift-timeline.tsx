'use client';

import {useMemo} from 'react';
import {cn} from '@/lib/utils';
import {format, parseISO} from 'date-fns';
import type {ProductionShift} from '@/types/production-run';
import type {TimelineEvent} from '@/hooks/use-shift-detail';
import {Badge} from '@/components/ui/badge';
import {Package, Droplet, Play, CheckCircle} from 'lucide-react';

interface ShiftTimelineProps {
  shift: ProductionShift;
  events: TimelineEvent[];
  isActive?: boolean;
  className?: string;
}

const eventConfig: Record<
  string,
  {
    gradient: string;
    bgLight: string;
    iconBg: string;
    textColor: string;
    label: string;
  }
> = {
  run_start: {
    gradient: 'from-green-500 to-emerald-500',
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    textColor: 'text-green-600 dark:text-green-400',
    label: 'Run Started',
  },
  run_end: {
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Run Completed',
  },
  output: {
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    label: 'Output',
  },
};

// Get icon based on event
function getEventIcon(event: TimelineEvent) {
  if (event.type === 'run_start') return Play;
  if (event.type === 'run_end') return CheckCircle;
  // For outputs, check if it's oil or meal
  if (event.color === 'cyan') return Droplet;
  return Package;
}

// Get config, with special handling for oil outputs
function getEventConfig(event: TimelineEvent) {
  if (event.type === 'output' && event.color === 'cyan') {
    return {
      gradient: 'from-cyan-500 to-sky-500',
      bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-sky-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      label: 'Output',
    };
  }
  return eventConfig[event.type] || eventConfig.output;
}

interface GroupedEvents {
  time: string;
  timeDisplay: string;
  events: TimelineEvent[];
}

// Group events that happen within 5 minutes of each other
function groupEventsByTime(events: TimelineEvent[]): GroupedEvents[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const groups: GroupedEvents[] = [];
  let currentGroup: GroupedEvents | null = null;

  for (const event of sorted) {
    const eventTime = new Date(event.time).getTime();

    if (!currentGroup) {
      currentGroup = {
        time: event.time,
        timeDisplay: format(parseISO(event.time), 'h:mm a'),
        events: [event],
      };
    } else {
      const groupTime = new Date(currentGroup.time).getTime();
      const diffMinutes = (eventTime - groupTime) / (1000 * 60);

      if (diffMinutes <= 5) {
        currentGroup.events.push(event);
      } else {
        groups.push(currentGroup);
        currentGroup = {
          time: event.time,
          timeDisplay: format(parseISO(event.time), 'h:mm a'),
          events: [event],
        };
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

// Filter out vehicle events - they're shown separately
function filterTimelineEvents(events: TimelineEvent[]) {
  return events.filter((e) => e.type !== 'vehicle');
}

// Count events by type for summary
function getEventSummary(events: TimelineEvent[]) {
  const outputs = events.filter((e) => e.type === 'output').length;
  const runs = events.filter(
    (e) => e.type === 'run_start' || e.type === 'run_end'
  ).length;
  return {outputs, runs};
}

export function ShiftTimeline({
  shift,
  events,
  isActive,
  className,
}: ShiftTimelineProps) {
  const filteredEvents = useMemo(() => filterTimelineEvents(events), [events]);
  const groupedEvents = useMemo(
    () => groupEventsByTime(filteredEvents),
    [filteredEvents]
  );
  const summary = useMemo(
    () => getEventSummary(filteredEvents),
    [filteredEvents]
  );

  return (
    <div className={cn('relative', className)}>
      {/* Header with summary chips */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{shift.name} Activity</h3>
            <p className="text-muted-foreground text-[10px]">
              Production timeline
            </p>
          </div>
          {isActive && (
            <Badge
              variant="outline"
              className="animate-pulse border-red-300 text-[10px] text-red-600"
            >
              LIVE
            </Badge>
          )}
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          {summary.outputs > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-900/30">
              <Package className="size-3 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                {summary.outputs} outputs
              </span>
            </div>
          )}
          {summary.runs > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 dark:bg-green-900/30">
              <Play className="size-3 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {summary.runs / 2} runs
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Gradient timeline line */}
        <div className="absolute top-0 bottom-0 left-[23px] w-0.5 rounded-full bg-gradient-to-b from-blue-400 via-amber-400 to-emerald-400 opacity-30" />

        {/* Event groups */}
        <div className="space-y-3">
          {groupedEvents.map((group, groupIndex) => (
            <div key={groupIndex} className="relative flex gap-3">
              {/* Time badge */}
              <div className="w-12 shrink-0 pt-2">
                <div className="rounded-md bg-slate-100 px-1.5 py-0.5 text-center dark:bg-slate-800">
                  <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {group.timeDisplay}
                  </span>
                </div>
              </div>

              {/* Events at this time */}
              <div className="flex-1 space-y-2">
                {group.events.map((event) => {
                  const Icon = getEventIcon(event);
                  const config = getEventConfig(event);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl border border-transparent p-3',
                        'transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                        config.bgLight
                      )}
                    >
                      {/* Colored left accent */}
                      <div
                        className={cn(
                          'absolute top-2 bottom-2 left-0 w-1 rounded-full bg-gradient-to-b',
                          config.gradient
                        )}
                      />

                      {/* Icon */}
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl shadow-sm',
                          config.iconBg
                        )}
                      >
                        <Icon className="size-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-semibold',
                            config.textColor
                          )}
                        >
                          {event.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {event.subtitle}
                        </p>
                      </div>

                      {/* Type badge */}
                      <div className="shrink-0">
                        <span
                          className={cn(
                            'text-[9px] font-medium tracking-wider uppercase opacity-60',
                            config.textColor
                          )}
                        >
                          {event.type === 'vehicle'
                            ? 'Offloaded'
                            : event.type === 'output'
                              ? 'Recorded'
                              : event.type === 'run_start'
                                ? 'Started'
                                : 'Completed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="py-8 text-center">
            <div className="bg-muted mb-3 inline-flex size-12 items-center justify-center rounded-full">
              <Package className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              No activity recorded yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
