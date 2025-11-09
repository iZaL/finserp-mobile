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
import { useExitVehicle } from "@/hooks/use-vehicle-bookings"
import type { VehicleBooking } from "@/types/vehicle-booking"
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
  const t = useTranslations('vehicleBookings.exitDialog')
  const tCommon = useTranslations('common')
  const [notes, setNotes] = useState("")
  const mutation = useExitVehicle()

  const handleOpenChange = (newOpen: boolean) => {
    if (!mutation.isPending) {
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

    await mutation.mutateAsync(booking.id)

    handleOpenChange(false)
    onSuccess()
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
                  <p className="text-muted-foreground text-xs">Status</p>
                  <p className="font-medium capitalize">{booking.status}</p>
                </div>
                {booking.actual_box_count && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">{t('receivedBoxes')}</p>
                    <p className="font-medium">{booking.actual_box_count} {t('boxes')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="exit_notes">{t('exitNotes')} ({tCommon('optional')})</Label>
              <Textarea
                id="exit_notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {t('charactersCount', { count: notes.length })}
              </p>
            </div>

            {/* Info */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ℹ️ {t('title')}
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
              disabled={mutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('exiting')}
                </>
              ) : (
                <>
                  <LogOut className="size-4 mr-2" />
                  {t('exit')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
