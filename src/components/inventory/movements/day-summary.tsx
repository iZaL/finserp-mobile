'use client';

import {ArrowDownRight, ArrowUpRight, ArrowRightLeft} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {cn} from '@/lib/utils';

interface DaySummaryProps {
  inbound: number;
  outbound: number;
  net: number;
  inboundLabel?: string;
  outboundLabel?: string;
  netLabel?: string;
  className?: string;
}

function formatQuantity(quantity: number): string {
  const mt = Math.abs(quantity) / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})} MT`;
  }
  return `${Math.abs(quantity).toLocaleString(undefined, {maximumFractionDigits: 2})} kg`;
}

export function DaySummary({
  inbound,
  outbound,
  net,
  inboundLabel = 'Inbound',
  outboundLabel = 'Outbound',
  netLabel = 'Net',
  className,
}: DaySummaryProps) {
  const isPositiveNet = net >= 0;

  return (
    <Card className={cn('bg-muted/50', className)}>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Inbound */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <ArrowUpRight className="size-4 text-green-600" />
              <span className="text-muted-foreground text-xs">
                {inboundLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-green-600">
              +{formatQuantity(inbound)}
            </p>
          </div>

          {/* Outbound */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <ArrowDownRight className="size-4 text-red-600" />
              <span className="text-muted-foreground text-xs">
                {outboundLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-red-600">
              -{formatQuantity(outbound)}
            </p>
          </div>

          {/* Net */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <ArrowRightLeft className="size-4 text-blue-600" />
              <span className="text-muted-foreground text-xs">{netLabel}</span>
            </div>
            <p
              className={cn(
                'text-sm font-semibold',
                isPositiveNet ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isPositiveNet ? '+' : '-'}
              {formatQuantity(net)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
