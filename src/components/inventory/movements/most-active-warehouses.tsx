'use client';

import {Warehouse} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {cn} from '@/lib/utils';
import type {WarehouseActivity} from '@/types/movements-calendar';

interface MostActiveWarehousesProps {
  warehouses: WarehouseActivity[];
  title?: string;
  movementsLabel?: string;
  className?: string;
}

export function MostActiveWarehouses({
  warehouses,
  title = 'Most Active Warehouses',
  movementsLabel = 'movements',
  className,
}: MostActiveWarehousesProps) {
  if (warehouses.length === 0) {
    return null;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {warehouses.map((warehouse, index) => (
          <div key={warehouse.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                  <Warehouse className="size-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{warehouse.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {warehouse.totalMovements} {movementsLabel}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                #{index + 1}
              </span>
            </div>
            <Progress value={warehouse.activityPercentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
