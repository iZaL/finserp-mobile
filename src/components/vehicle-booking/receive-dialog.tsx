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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"

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
  const [receivedBoxCount, setReceivedBoxCount] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setReceivedBoxCount("")
        setNotes("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    const boxCount = parseInt(receivedBoxCount)
    if (isNaN(boxCount) || boxCount < 0 || boxCount > 10000) {
      toast.error("Please enter a valid box count (0-10000)")
      return
    }

    try {
      setLoading(true)
      await vehicleBookingService.receiveVehicle(booking.id, {
        received_box_count: boxCount,
        notes: notes.trim() || undefined,
      })

      const difference = boxCount - booking.box_count
      let message = `Vehicle ${booking.vehicle_number} received successfully!`

      if (difference !== 0) {
        message += ` (Actual: ${boxCount}, Expected: ${booking.box_count}, Difference: ${difference > 0 ? "+" : ""}${difference})`
      }

      toast.success(message)
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error receiving vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill with expected box count when dialog opens
  if (open && booking && !receivedBoxCount) {
    setReceivedBoxCount(booking.box_count.toString())
  }

  if (!booking) return null

  const expectedBoxCount = booking.box_count
  const actualBoxCount = receivedBoxCount ? parseInt(receivedBoxCount) : 0
  const difference = actualBoxCount - expectedBoxCount

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] !bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle>Receive Vehicle</DialogTitle>
          <DialogDescription>
            Enter the actual number of boxes received for vehicle {booking.vehicle_number}
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
                  <p className="text-muted-foreground text-xs">Expected Boxes</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Box Weight</p>
                  <p className="font-medium">{booking.box_weight_kg || 'N/A'} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Weight</p>
                  <p className="font-medium">{Number(booking.weight_tons || 0).toFixed(2)} tons</p>
                </div>
              </div>
            </div>

            {/* Received Box Count */}
            <div className="space-y-2">
              <Label htmlFor="received_box_count">
                Actual Boxes Received <span className="text-red-500">*</span>
              </Label>
              <Input
                id="received_box_count"
                type="number"
                min="0"
                max="10000"
                value={receivedBoxCount}
                onChange={(e) => setReceivedBoxCount(e.target.value)}
                placeholder="Enter actual box count"
                required
                autoFocus
              />
              {difference !== 0 && receivedBoxCount && (
                <p className={`text-xs ${difference > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                  Difference: {difference > 0 ? "+" : ""}{difference} boxes
                  {difference > 0 ? " (more than expected)" : " (less than expected)"}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
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
              disabled={loading || !receivedBoxCount}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Receiving...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4 mr-2" />
                  Confirm Receive
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
