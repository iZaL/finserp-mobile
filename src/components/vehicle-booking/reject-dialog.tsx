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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRejectVehicle } from "@/hooks/use-vehicle-bookings"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { REJECTION_REASONS } from "@/types/vehicle-booking"
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
  const t = useTranslations('vehicleBookings.rejectDialog')
  const tCommon = useTranslations('common')
  const tReasons = useTranslations('vehicleBookings.rejectionReasons')
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionNotes, setRejectionNotes] = useState("")
  const mutation = useRejectVehicle()

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
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
      return
    }

    await mutation.mutateAsync({
      id: booking.id,
      data: {
        rejection_reason: rejectionReason,
        rejection_notes: rejectionNotes.trim() || undefined,
      },
    })

    handleOpenChange(false)
    onSuccess()
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { vehicle: booking.vehicle_number })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Vehicle Info */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t('vehicleNumber')}</p>
                  <p className="font-medium">{booking.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('boxCount')}</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                {booking.driver_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{t('driver')}</p>
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
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
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
                {t('additionalNotes')} {rejectionReason === "Other" && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="rejection_notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
                required={rejectionReason === "Other"}
              />
              <p className="text-xs text-muted-foreground">
                {t('charactersCount', { count: rejectionNotes.length })}
              </p>
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ {tCommon('required')}: {t('deleteConfirm')}
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
              disabled={mutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending || !rejectionReason || (rejectionReason === "Other" && !rejectionNotes.trim())}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('rejecting')}
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-2" />
                  {t('reject')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
