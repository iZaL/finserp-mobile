"use client"

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
import type { VehicleBooking } from "@/types/vehicle-booking"
import { CheckCircle, Loader2, Truck } from "lucide-react"
import { useReceiveVehicle } from "@/hooks/use-vehicle-bookings"

interface ReceiveDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReceiveDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: ReceiveDialogProps) {
  const tCommon = useTranslations('common')
  const receiveMutation = useReceiveVehicle()

  const handleOpenChange = (newOpen: boolean) => {
    if (!receiveMutation.isPending) {
      onOpenChange(newOpen)
    }
  }

  const handleConfirm = () => {
    if (!booking) return

    receiveMutation.mutate({
      id: booking.id,
      data: {},
    }, {
      onSuccess: () => {
        // Close dialog after mutation AND cache updates complete
        handleOpenChange(false)
        onSuccess()
      },
      onError: (error) => {
        console.error("Error receiving vehicle:", error)
      }
    })
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="size-5" />
            Receive Vehicle
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to receive vehicle <strong>{booking.vehicle_number}</strong>?
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
            disabled={receiveMutation.isPending}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={receiveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {receiveMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Receiving...
              </>
            ) : (
              <>
                <CheckCircle className="size-4 mr-2" />
                Receive Vehicle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
