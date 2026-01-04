'use client';

import {useTranslations} from 'next-intl';
import {ClipboardList, Package, ArrowRightLeft, TrendingUp} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

function SummaryCard({icon: Icon, label, value, color}: SummaryCardProps) {
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
      <div
        className={`flex size-10 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function TodaySummary() {
  const t = useTranslations('productionHub.todaySummary');

  // TODO: Replace with actual data from useProductionHub hook
  const summaryData = {
    outputRecorded: '0 kg',
    batchesCreated: 0,
    transfers: 0,
    movements: 0,
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{t('title')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={ClipboardList}
            label={t('outputRecorded')}
            value={summaryData.outputRecorded}
            color="bg-blue-500"
          />
          <SummaryCard
            icon={Package}
            label={t('batchesCreated')}
            value={summaryData.batchesCreated}
            color="bg-amber-500"
          />
          <SummaryCard
            icon={ArrowRightLeft}
            label={t('transfers')}
            value={summaryData.transfers}
            color="bg-violet-500"
          />
          <SummaryCard
            icon={TrendingUp}
            label={t('movements')}
            value={summaryData.movements}
            color="bg-emerald-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
