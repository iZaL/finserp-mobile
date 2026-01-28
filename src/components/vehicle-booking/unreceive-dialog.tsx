'use client';

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
import {useUnreceiveVehicle} from '@/hooks/use-vehicle-bookings';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {RotateCcw, Loader2} from 'lucide-react';

interface UnreceiveDialogProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UnreceiveDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: UnreceiveDialogProps) {
  const t = useTranslations('vehicleBookings');
  const tCommon = useTranslations('common');
  const mutation = useUnreceiveVehicle();

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    mutation.mutate(booking.id, {
      onSuccess: () => {
        // Close dialog after mutation AND cache updates complete
        handleOpenChange(false);
        onSuccess?.();
      },
    });
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unreceive Vehicle</DialogTitle>
          <DialogDescription>
            {t('unreceiveConfirm', {vehicle: booking.vehicle_number})}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Vehicle Info */}
            <div className="bg-muted/50 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Vehicle Number
                  </p>
                  <p className="font-medium">{booking.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-medium capitalize">{booking.status}</p>
                </div>
                {booking.actual_box_count && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">
                      Received Boxes
                    </p>
                    <p className="font-medium">
                      {booking.actual_box_count} {t('bookingCard.boxes')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-orange-800 p-3 dark:border-orange-800">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                ⚠️ Confirm Action
              </p>
              <p className="mt-1 text-xs text-orange-600/80 dark:text-orange-400/80">
                This will revert the vehicle back to booked status and remove
                the received information.
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
              className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Reverting...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 size-4" />
                  Unreceive
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
