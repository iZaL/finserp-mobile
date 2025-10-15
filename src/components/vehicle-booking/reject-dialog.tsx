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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { REJECTION_REASONS } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { XCircle, Loader2 } from "lucide-react"

interface RejectDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function RejectDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: RejectDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setRejectionReason("")
        setRejectionNotes("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    if (!rejectionReason) {
      toast.error("Please select a rejection reason")
      return
    }

    try {
      setLoading(true)
      await vehicleBookingService.rejectVehicle(booking.id, {
        rejection_reason: rejectionReason,
        rejection_notes: rejectionNotes.trim() || undefined,
      })

      toast.success(`Vehicle ${booking.vehicle_number} has been rejected`)
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error rejecting vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] !bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle>Reject Vehicle</DialogTitle>
          <DialogDescription>
            Please select a reason for rejecting vehicle {booking.vehicle_number}
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

            {/* Rejection Reason */}
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger id="rejection_reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="!bg-black border-gray-800">
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="rejection_notes">
                Additional Notes {rejectionReason === "Other" && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="rejection_notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder={
                  rejectionReason === "Other"
                    ? "Please explain the rejection reason..."
                    : "Add any additional details (optional)..."
                }
                rows={3}
                maxLength={500}
                required={rejectionReason === "Other"}
              />
              <p className="text-xs text-muted-foreground">
                {rejectionNotes.length}/500 characters
              </p>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠ Warning: This action cannot be undone
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                The vehicle will be marked as rejected and removed from the active queue.
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
              variant="destructive"
              disabled={loading || !rejectionReason || (rejectionReason === "Other" && !rejectionNotes.trim())}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
