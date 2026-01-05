'use client';

import {useSearchParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {ArrowLeft, ArrowRightLeft, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
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
      <div className="flex min-h-screen flex-col pb-32">
        {/* Header */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <div className="container mx-auto flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground text-xs">
                {t('batchOnlySubtitle') ||
                  'Select a batch to transfer between warehouses'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="container mx-auto flex min-h-0 flex-1 flex-col p-4">
          <TransferForm
            initialBatchId={initialBatchId}
            onSuccess={handleSuccess}
            fullHeight
            renderActions={({onSubmit, isSubmitting, isValid}) => (
              <div className="bg-background/95 fixed right-0 bottom-16 left-0 z-50 border-t p-4 shadow-lg backdrop-blur-sm">
                <Button
                  className="h-12 w-full text-lg"
                  onClick={onSubmit}
                  disabled={isSubmitting || !isValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 size-5 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="me-2 size-5" />
                      {t('submit')}
                    </>
                  )}
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </InventoryGuard>
  );
}
