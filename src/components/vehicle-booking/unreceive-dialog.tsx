"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { RotateCcw, Loader2 } from "lucide-react"

interface UnreceiveDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UnreceiveDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: UnreceiveDialogProps) {
  const t = useTranslations('vehicleBookings')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    try {
      setLoading(true)
      await vehicleBookingService.unreceiveVehicle(booking.id)

      toast.success(t('unreceiveSuccess', { vehicle: booking.vehicle_number }))
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error unreceiving vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unreceive Vehicle</DialogTitle>
          <DialogDescription>
            {t('unreceiveConfirm', { vehicle: booking.vehicle_number })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Vehicle Info */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Vehicle Number</p>
                  <p className="font-medium">{booking.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-medium capitalize">{booking.status}</p>
                </div>
                {booking.actual_box_count && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Received Boxes</p>
                    <p className="font-medium">{booking.actual_box_count} {t('bookingCard.boxes')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-orange-800 dark:border-orange-800 p-3">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ Confirm Action
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                This will revert the vehicle back to booked status and remove the received information.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Reverting...
                </>
              ) : (
                <>
                  <RotateCcw className="size-4 mr-2" />
                  Unreceive
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
