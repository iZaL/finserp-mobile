'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  TrendingUp,
} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import type {PeriodSummary} from '@/types/movements-calendar';

interface MonthSummaryProps {
  summary: PeriodSummary;
  title?: string;
  inboundLabel?: string;
  outboundLabel?: string;
  transfersLabel?: string;
  netChangeLabel?: string;
  className?: string;
}

function formatQuantity(quantity: number): string {
  const mt = Math.abs(quantity) / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 1})} MT`;
  }
  return `${Math.abs(quantity).toLocaleString(undefined, {maximumFractionDigits: 0})} kg`;
}

export function MonthSummary({
  summary,
  title = 'Monthly Summary',
  inboundLabel = 'Total Inbound',
  outboundLabel = 'Total Outbound',
  transfersLabel = 'Transfers',
  netChangeLabel = 'Net Change',
  className,
}: MonthSummaryProps) {
  const isPositiveNet = summary.netChange >= 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Inbound */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
              <ArrowUpRight className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{inboundLabel}</p>
              <p className="text-sm font-semibold text-green-600">
                +{formatQuantity(summary.totalInbound)}
              </p>
            </div>
          </div>

          {/* Total Outbound */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
              <ArrowDownRight className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{outboundLabel}</p>
              <p className="text-sm font-semibold text-red-600">
                -{formatQuantity(summary.totalOutbound)}
              </p>
            </div>
          </div>

          {/* Transfers */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100">
              <ArrowRightLeft className="size-5 text-orange-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{transfersLabel}</p>
              <p className="text-sm font-semibold text-orange-600">
                {summary.transferCount} (
                {formatQuantity(summary.totalTransfers)})
              </p>
            </div>
          </div>

          {/* Net Change */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
              <TrendingUp className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{netChangeLabel}</p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  isPositiveNet ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isPositiveNet ? '+' : '-'}
                {formatQuantity(summary.netChange)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
