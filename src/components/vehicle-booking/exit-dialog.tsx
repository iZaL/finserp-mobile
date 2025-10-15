"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { LogOut, Loader2 } from "lucide-react"

interface ExitDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ExitDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: ExitDialogProps) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setNotes("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    try {
      setLoading(true)
      await vehicleBookingService.exitVehicle(booking.id)

      toast.success(`Vehicle ${booking.vehicle_number} has exited successfully`)
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error exiting vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] !bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle>Exit Vehicle</DialogTitle>
          <DialogDescription>
            Mark vehicle {booking.vehicle_number} as exited from the facility
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
                    <p className="font-medium">{booking.actual_box_count} boxes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="exit_notes">Exit Notes (Optional)</Label>
              <Textarea
                id="exit_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any exit notes or observations..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ℹ️ Exit Confirmation
              </p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                The vehicle will be marked as exited and removed from the active queue.
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Exiting...
                </>
              ) : (
                <>
                  <LogOut className="size-4 mr-2" />
                  Confirm Exit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
