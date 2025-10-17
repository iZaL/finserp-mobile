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
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"

interface ApproveDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApproveDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: ApproveDialogProps) {
  const t = useTranslations('vehicleBookings.approveDialog')
  const tCommon = useTranslations('common')
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setNotes("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    try {
      setLoading(true)
      await vehicleBookingService.approveVehicle(booking.id, {
        notes: notes.trim() || undefined,
      })

      toast.success(t('success', { vehicle: booking.vehicle_number }))
      handleOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error approving vehicle:", error)
      toast.error(t('error'))
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
            <CheckCircle className="size-5 text-green-600" />
            {t('title')}
          </DialogTitle>
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
                  <p className="text-muted-foreground text-xs">{t('boxes')}</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                {booking.driver_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{t('driver')}</p>
                    <p className="font-medium">{booking.driver_name}</p>
                  </div>
                )}
                {booking.supplier_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{t('supplier')}</p>
                    <p className="font-medium">{booking.supplier_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')} ({tCommon('optional')})</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 {tCommon('characters')}
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
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('approving')}
                </>
              ) : (
                <>
                  <CheckCircle className="size-4 mr-2" />
                  {t('approve')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
