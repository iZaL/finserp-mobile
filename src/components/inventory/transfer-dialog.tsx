'use client';

import {useTranslations} from 'next-intl';
import {ArrowRightLeft} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {TransferForm} from './transfer-form';

export interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId?: number;
  onSuccess?: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  batchId,
  onSuccess,
}: TransferDialogProps) {
  const t = useTranslations('inventory.transfer');

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-blue-600" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <TransferForm
          initialBatchId={batchId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          showCancelButton={true}
        />
      </DialogContent>
    </Dialog>
  );
}
