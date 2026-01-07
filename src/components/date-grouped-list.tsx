'use client';

import {Fragment, useState, useEffect, ReactNode} from 'react';
import {Calendar, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface DateGroup<T> {
  date: string;
  items: T[];
}

interface DateGroupedListProps<T> {
  groups: DateGroup<T>[];
  renderItem: (item: T, index: number) => ReactNode;
  renderSummary?: (group: DateGroup<T>) => ReactNode;
  getItemKey: (item: T) => string | number;
  defaultExpanded?: boolean;
  emptyMessage?: string;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
  });
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string
): DateGroup<T>[] {
  const byDate: Record<string, T[]> = {};

  items.forEach((item) => {
    const date = getDate(item);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  });

  return Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({date, items}));
}

export function DateGroupedList<T>({
  groups,
  renderItem,
  renderSummary,
  getItemKey,
  defaultExpanded = false,
  emptyMessage = 'No items',
}: DateGroupedListProps<T>) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto-expand all dates when defaultExpanded is true (only once)
  useEffect(() => {
    if (defaultExpanded && groups.length > 0 && !hasAutoExpanded) {
      setExpandedDates(new Set(groups.map((g) => g.date)));
      setHasAutoExpanded(true);
    }
  }, [defaultExpanded, groups, hasAutoExpanded]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-background overflow-hidden">
      <div className="divide-y">
        {groups.map((group) => {
          const isExpanded = expandedDates.has(group.date);
          const hasMultiple = group.items.length > 1;

          return (
            <Fragment key={group.date}>
              {/* Date header row */}
              <div
                className={cn(
                  'group flex cursor-pointer items-center gap-2 px-2 py-2.5 transition-colors',
                  'hover:bg-muted/50'
                )}
                onClick={() => toggleDate(group.date)}
              >
                {/* Date icon */}
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700'
                  )}
                >
                  <Calendar className="text-muted-foreground size-4" />
                </div>

                {/* Date info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold">
                      {formatDate(group.date)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatShortDate(group.date)}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {group.items.length} record{group.items.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Optional summary */}
                {renderSummary && (
                  <div className="shrink-0">{renderSummary(group)}</div>
                )}

                {/* Expand indicator */}
                <div className="w-4 shrink-0">
                  <ChevronRight
                    className={cn(
                      'text-muted-foreground size-4 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="bg-muted/20 border-muted border-t">
                  <div className="space-y-0.5 px-1 py-1">
                    {group.items.map((item, index) => (
                      <Fragment key={getItemKey(item)}>
                        {renderItem(item, index)}
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
