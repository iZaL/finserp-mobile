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
import {useDeleteVehicleBooking} from '@/hooks/use-vehicle-bookings';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {Trash2, Loader2} from 'lucide-react';

interface DeleteDialogProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: DeleteDialogProps) {
  const t = useTranslations('vehicleBookings');
  const tCommon = useTranslations('common');
  const mutation = useDeleteVehicleBooking();

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
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogDescription>
            {t('deleteConfirm', {vehicle: booking.vehicle_number})}
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
                  <p className="text-muted-foreground text-xs">Box Count</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                {booking.driver_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Driver</p>
                    <p className="font-medium">{booking.driver_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-red-800 p-3 dark:border-red-800">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠️ Warning
              </p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                This action cannot be undone. The vehicle booking will be
                permanently deleted from the system.
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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
