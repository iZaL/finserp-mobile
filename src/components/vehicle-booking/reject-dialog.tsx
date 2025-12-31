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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {useRejectVehicle} from '@/hooks/use-vehicle-bookings';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {REJECTION_REASONS} from '@/types/vehicle-booking';
import {XCircle, Loader2} from 'lucide-react';

interface RejectDialogProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RejectDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RejectDialogProps) {
  const t = useTranslations('vehicleBookings.rejectDialog');
  const tCommon = useTranslations('common');
  const tReasons = useTranslations('vehicleBookings.rejectionReasons');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const mutation = useRejectVehicle();

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setRejectionReason('');
        setRejectionNotes('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    if (!rejectionReason) {
      return;
    }

    mutation.mutate(
      {
        id: booking.id,
        data: {
          rejection_reason: rejectionReason,
          rejection_notes: rejectionNotes.trim() || undefined,
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
          <DialogTitle>{t('title')}</DialogTitle>
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
                  <p className="text-muted-foreground text-xs">
                    {t('boxCount')}
                  </p>
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
              </div>
            </div>

            {/* Rejection Reason */}
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">
                {t('rejectionReason')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger id="rejection_reason">
                  <SelectValue placeholder={t('selectReason')} />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {tReasons(reason.toLowerCase().replace(/ /g, ''))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="rejection_notes">
                {t('additionalNotes')}{' '}
                {rejectionReason === 'Other' && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                id="rejection_notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
                required={rejectionReason === 'Other'}
              />
              <p className="text-muted-foreground text-xs">
                {t('charactersCount', {count: rejectionNotes.length})}
              </p>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/10">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠️ {tCommon('required')}: {t('deleteConfirm')}
              </p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                The vehicle will be marked as rejected and removed from the
                active queue.
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
              variant="destructive"
              disabled={
                mutation.isPending ||
                !rejectionReason ||
                (rejectionReason === 'Other' && !rejectionNotes.trim())
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  {t('reject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
