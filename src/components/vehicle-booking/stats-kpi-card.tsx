'use client';

import * as React from 'react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {ArrowDown, ArrowUp} from 'lucide-react';
import {cn} from '@/lib/utils';

interface StatsKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

export function StatsKPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className,
}: StatsKPICardProps) {
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <ArrowUp className="h-3 w-3" />;
    if (trendValue < 0) return <ArrowDown className="h-3 w-3" />;
    return null;
  };

  return (
    <Card className={cn('space-y-1.5 p-3', className)}>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <h3 className="text-muted-foreground line-clamp-1 text-[10px] font-medium">
            {title}
          </h3>
        </div>
        {badge && (
          <Badge
            variant={badge.variant || 'default'}
            className="h-4 shrink-0 px-1.5 text-[9px]"
          >
            {badge.label}
          </Badge>
        )}
      </div>

      {/* Main Value */}
      <div className="space-y-0.5">
        <p className="text-xl leading-none font-bold">{value}</p>
        {subtitle && (
          <p className="text-muted-foreground line-clamp-1 text-[10px]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-[10px]',
            getTrendColor(trend.value)
          )}
        >
          {getTrendIcon(trend.value)}
          <span className="font-medium">
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-muted-foreground truncate">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}
