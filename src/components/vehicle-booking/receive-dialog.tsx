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
  const t = useTranslations('vehicleBookings.receiveDialog')
  const tCommon = useTranslations('common')
  const tValidation = useTranslations('vehicleBookings.validation')
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
      toast.error(tValidation('actualBoxCountRequired'))
      return
    }

    try {
      setLoading(true)
      await vehicleBookingService.receiveVehicle(booking.id, {
        received_box_count: boxCount,
        notes: notes.trim() || undefined,
      })

      toast.success(t('success', { vehicle: booking.vehicle_number }))
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
                  <p className="text-muted-foreground text-xs">{t('expectedBoxes')}</p>
                  <p className="font-medium">{booking.box_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('boxWeight')}</p>
                  <p className="font-medium">{booking.box_weight_kg || 'N/A'} kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('totalWeight')}</p>
                  <p className="font-medium">{Number(booking.weight_tons || 0).toFixed(2)} {t('tons')}</p>
                </div>
              </div>
            </div>

            {/* Received Box Count */}
            <div className="space-y-2">
              <Label htmlFor="received_box_count">
                {t('actualBoxCount')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="received_box_count"
                type="number"
                min="0"
                max="10000"
                value={receivedBoxCount}
                onChange={(e) => setReceivedBoxCount(e.target.value)}
                placeholder={tValidation('actualBoxCountRequired')}
                required
                autoFocus
              />
              {difference !== 0 && receivedBoxCount && (
                <p className={`text-xs ${difference > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                  {t('discrepancy')}: {difference > 0 ? "+" : ""}{difference} {t('boxes')}
                  {difference > 0 ? ` (${t('more')})` : ` (${t('less')})`}
                </p>
              )}
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
                {t('charactersCount', { count: notes.length })}
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
              disabled={loading || !receivedBoxCount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('receiving')}
                </>
              ) : (
                <>
                  <CheckCircle className="size-4 mr-2" />
                  {t('receive')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
