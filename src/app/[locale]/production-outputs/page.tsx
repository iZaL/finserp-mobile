'use client';

import {useTranslations} from 'next-intl';
import {ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ProductionOutputsGuard} from '@/components/permission-guard';
import {ProductionOutputsTable} from '@/components/production-outputs-table';

export default function ProductionOutputsPage() {
  const t = useTranslations('productionOutputs');

  return (
    <ProductionOutputsGuard>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <ProductionOutputsTable
            showBatchingCard={true}
            showEmptyState={true}
            defaultExpanded={true}
          />
        </div>
      </div>
    </ProductionOutputsGuard>
  );
}
