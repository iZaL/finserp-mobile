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
import {useApproveVehicle} from '@/hooks/use-vehicle-bookings';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {CheckCircle, Loader2} from 'lucide-react';

interface ApproveDialogProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: ApproveDialogProps) {
  const t = useTranslations('vehicleBookings.approveDialog');
  const tCommon = useTranslations('common');
  const [notes, setNotes] = useState('');
  const mutation = useApproveVehicle();

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setNotes('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    mutation.mutate(
      {
        id: booking.id,
        data: {
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          // Close dialog after mutation AND cache updates complete
          handleOpenChange(false);
          onSuccess?.();
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
            <CheckCircle className="size-5 text-green-600" />
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('notes')} ({tCommon('optional')})
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
              />
              <p className="text-muted-foreground text-xs">
                {notes.length}/500 {tCommon('characters')}
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
              disabled={mutation.isPending}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('approving')}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 size-4" />
                  {t('approve')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
