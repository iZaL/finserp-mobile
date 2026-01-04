'use client';

import {useSearchParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {TransferForm} from '@/components/inventory/transfer-form';
import {InventoryGuard} from '@/components/permission-guard';

export default function TransferPage() {
  const router = useRouter();
  const t = useTranslations('inventory.transfer');
  const searchParams = useSearchParams();

  // Get initial batch_id from URL params
  const initialBatchId = searchParams.get('batch_id')
    ? parseInt(searchParams.get('batch_id')!)
    : undefined;

  const handleSuccess = () => {
    router.push('/batches');
  };

  return (
    <InventoryGuard>
      <div className="container mx-auto space-y-4 p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('batchOnlySubtitle') ||
                'Select a batch to transfer between warehouses'}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="pt-6">
            <TransferForm
              initialBatchId={initialBatchId}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </InventoryGuard>
  );
}
