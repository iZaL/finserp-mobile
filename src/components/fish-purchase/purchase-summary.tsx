'use client';

import {useTranslations} from 'next-intl';
import {Package, Scale, CircleDollarSign} from 'lucide-react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {FishPurchaseItem, FishSpecies} from '@/types/fish-purchase';

interface PurchaseSummaryProps {
  items:
    | FishPurchaseItem[]
    | Array<{
        fish_species_id: number;
        box_count: number;
        box_weights: number[];
        rate: number;
        id?: string | number;
        fish_count?: string;
        remarks?: string;
        average_box_weight?: number;
        net_weight?: number;
        net_amount?: number;
      }>;
  showDetails?: boolean;
  fishSpecies?: FishSpecies[];
}

export function PurchaseSummary({
  items,
  showDetails = true,
  fishSpecies = [],
}: PurchaseSummaryProps) {
  const t = useTranslations('fishPurchases');

  // Calculate totals
  const totalBoxes = items.reduce(
    (sum, item) => sum + (item.box_count || 0),
    0
  );
  const totalWeight = items.reduce(
    (sum, item) => sum + (item.net_weight || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.net_amount || 0),
    0
  );

  // Format number with thousand separators
  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Get fish species name by ID
  const getSpeciesName = (speciesId: number) => {
    const species = fishSpecies.find((s) => s.id === speciesId);
    return species?.name || t('items.species');
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Total Boxes */}
          <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-4 text-center dark:bg-gray-900">
            <Package className="text-muted-foreground mb-2 size-6" />
            <p className="text-muted-foreground mb-1 text-xs">
              {t('summary.totalBoxes')}
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalBoxes, 0)}</p>
            <p className="text-muted-foreground mt-1 text-xs">boxes</p>
          </div>

          {/* Total Weight */}
          <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-4 text-center dark:bg-gray-900">
            <Scale className="text-muted-foreground mb-2 size-6" />
            <p className="text-muted-foreground mb-1 text-xs">
              {t('summary.totalWeight')}
            </p>
            <p className="text-2xl font-bold">
              {formatNumber(totalWeight / 1000, 3)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">ton</p>
          </div>

          {/* Total Amount */}
          <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-4 text-center dark:bg-gray-900">
            <CircleDollarSign className="text-muted-foreground mb-2 size-6" />
            <p className="text-muted-foreground mb-1 text-xs">
              {t('summary.totalAmount')}
            </p>
            <p className="text-primary text-2xl font-bold">
              {formatNumber(totalAmount)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">OMR</p>
          </div>
        </div>

        {/* Item Details */}
        {showDetails && items.length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-3 text-sm font-semibold">
              {t('summary.itemBreakdown')}
            </p>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span className="text-muted-foreground">
                    {getSpeciesName(item.fish_species_id)} × {item.box_count}{' '}
                    boxes
                  </span>
                  <span className="font-semibold">
                    {formatNumber(item.net_weight || 0)} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
