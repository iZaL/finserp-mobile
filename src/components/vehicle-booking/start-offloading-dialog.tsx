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
import { CheckCircle, Loader2, Truck } from "lucide-react"

interface StartOffloadingDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StartOffloadingDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: StartOffloadingDialogProps) {
  const t = useTranslations('vehicleBookings')
  const tCommon = useTranslations('common')
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
    }
  }

  const handleConfirm = async () => {
    if (!booking) return

    try {
      setLoading(true)
      await vehicleBookingService.startOffloading(booking.id)

      toast.success(t('startOffloadingSuccess'))
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error starting offloading:", error)
      toast.error(t('startOffloadingError'))
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="size-5" />
            Start Offloading
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to start offloading for vehicle <strong>{booking.vehicle_number}</strong>?
          </DialogDescription>
        </DialogHeader>

        {/* Vehicle Summary */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Vehicle</p>
              <p className="font-medium">{booking.vehicle_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Boxes</p>
              <p className="font-medium">{booking.box_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Weight</p>
              <p className="font-medium">{Number(booking.weight_tons || 0).toFixed(2)} tons</p>
            </div>
            {booking.driver_name && (
              <div>
                <p className="text-muted-foreground text-xs">Driver</p>
                <p className="font-medium">{booking.driver_name}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <CheckCircle className="size-4 mr-2" />
                Start Offloading
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}