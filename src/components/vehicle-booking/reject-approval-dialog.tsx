'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {useRejectApproval} from '@/hooks/use-vehicle-bookings';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {XCircle, Loader2} from 'lucide-react';

interface RejectApprovalDialogProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RejectApprovalDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RejectApprovalDialogProps) {
  const t = useTranslations('vehicleBookings.rejectApprovalDialog');
  const tCommon = useTranslations('common');
  const [notes, setNotes] = useState('');
  const mutation = useRejectApproval();

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setNotes('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    if (!notes.trim()) {
      return;
    }

    mutation.mutate(
      {
        id: booking.id,
        data: {
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          // Close dialog after mutation AND cache updates complete
          handleOpenChange(false);
          onSuccess();
        },
      }
    );
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="size-5 text-red-600" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description', {vehicle: booking.vehicle_number})}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Vehicle Info */}
            <div className="bg-muted/50 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t('vehicleNumber')}
                  </p>
                  <p className="font-medium">{booking.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('boxes')}</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                {booking.driver_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">
                      {t('driver')}
                    </p>
                    <p className="font-medium">{booking.driver_name}</p>
                  </div>
                )}
                {booking.supplier_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">
                      {t('supplier')}
                    </p>
                    <p className="font-medium">{booking.supplier_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('rejectionNotes')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={4}
                maxLength={500}
                required
                autoFocus
                className="border-red-200 focus-visible:ring-red-500"
              />
              <p className="text-muted-foreground text-xs">
                {notes.length}/500 {tCommon('characters')}
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {t('warning')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !notes.trim()}
              variant="destructive"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  {t('rejectApproval')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
