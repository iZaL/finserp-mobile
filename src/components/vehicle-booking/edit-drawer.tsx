"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Truck, Package, User, Phone, Users, FileText, Weight } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import { toast } from "sonner"

interface EditDrawerProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDrawer({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: EditDrawerProps) {
  const t = useTranslations('vehicleBookings.editDialog')
  const tCommon = useTranslations('common')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_number: "",
    box_count: 0,
    box_weight_kg: 50,
    driver_name: "",
    driver_phone: "",
    supplier_name: "",
    supplier_phone: "",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when booking changes
  useEffect(() => {
    if (booking && open) {
      setFormData({
        vehicle_number: booking.vehicle_number,
        box_count: booking.box_count,
        box_weight_kg: booking.box_weight_kg || 50,
        driver_name: booking.driver_name || "",
        driver_phone: booking.driver_phone || "",
        supplier_name: booking.supplier_name || "",
        supplier_phone: booking.supplier_phone || "",
        notes: booking.notes || "",
      })
      setErrors({})
    }
  }, [booking, open])

  const calculateTotalWeight = () => {
    return ((formData.box_count * formData.box_weight_kg) / 1000).toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    // Validate
    const newErrors: Record<string, string> = {}

    if (!formData.vehicle_number.trim()) {
      newErrors.vehicle_number = t('validation.vehicleNumberRequired')
    }

    if (formData.box_count <= 0) {
      newErrors.box_count = t('validation.boxCountRequired')
    }

    if (formData.box_weight_kg <= 0) {
      newErrors.box_weight_kg = t('validation.boxWeightRequired')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await vehicleBookingService.updateBooking(booking.id, {
        vehicle_number: formData.vehicle_number,
        box_count: formData.box_count,
        box_weight_kg: formData.box_weight_kg,
        driver_name: formData.driver_name || undefined,
        driver_phone: formData.driver_phone || undefined,
        supplier_name: formData.supplier_name || undefined,
        supplier_phone: formData.supplier_phone || undefined,
        notes: formData.notes || undefined,
      })

      toast.success(t('success', { vehicle: formData.vehicle_number }))
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        setErrors(error.errors as Record<string, string>)
      } else {
        const errorMessage = error instanceof Error ? error.message : t('error')
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!booking) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Truck className="size-5 text-blue-600 dark:text-blue-400" />
            {t('title')}
          </DrawerTitle>
          <DrawerDescription>
            {t('description', { vehicle: booking.vehicle_number })}
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            {/* Vehicle Number */}
            <div>
              <Label htmlFor="vehicle_number" className="flex items-center gap-2">
                <Truck className="size-4" />
                {t('vehicleNumber')}
              </Label>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => {
                  setFormData({ ...formData, vehicle_number: e.target.value })
                  setErrors({ ...errors, vehicle_number: "" })
                }}
                placeholder={t('placeholders.vehicleNumber')}
                disabled={isSubmitting}
                className="mt-1.5"
              />
              {errors.vehicle_number && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {errors.vehicle_number}
                </p>
              )}
            </div>

            {/* Box Count and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="box_count" className="flex items-center gap-2">
                  <Package className="size-4" />
                  {t('boxCount')}
                </Label>
                <Input
                  id="box_count"
                  type="number"
                  min="1"
                  value={formData.box_count}
                  onChange={(e) => {
                    setFormData({ ...formData, box_count: parseInt(e.target.value) || 0 })
                    setErrors({ ...errors, box_count: "" })
                  }}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
                {errors.box_count && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.box_count}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="box_weight_kg" className="flex items-center gap-2">
                  <Weight className="size-4" />
                  {t('boxWeight')}
                </Label>
                <Input
                  id="box_weight_kg"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.box_weight_kg}
                  onChange={(e) => {
                    setFormData({ ...formData, box_weight_kg: parseFloat(e.target.value) || 0 })
                    setErrors({ ...errors, box_weight_kg: "" })
                  }}
                  placeholder="20.0"
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
                {errors.box_weight_kg && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.box_weight_kg}
                  </p>
                )}
              </div>
            </div>

            {/* Total Weight Display */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('totalWeight')}
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {calculateTotalWeight()} tons
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {formData.box_count} boxes × {formData.box_weight_kg} kg
              </p>
            </div>

            {/* Driver Information */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4" />
                {t('driverInformation')}
              </h4>

              <div>
                <Label htmlFor="driver_name">{t('driverName')}</Label>
                <Input
                  id="driver_name"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  placeholder={t('placeholders.driverName')}
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="driver_phone" className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {t('driverPhone')}
                </Label>
                <Input
                  id="driver_phone"
                  type="tel"
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  placeholder={t('placeholders.driverPhone')}
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Supplier Information */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="size-4" />
                {t('supplierInformation')}
              </h4>

              <div>
                <Label htmlFor="supplier_name">{t('supplierName')}</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder={t('placeholders.supplierName')}
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="supplier_phone" className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {t('supplierPhone')}
                </Label>
                <Input
                  id="supplier_phone"
                  type="tel"
                  value={formData.supplier_phone}
                  onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                  placeholder={t('placeholders.supplierPhone')}
                  disabled={isSubmitting}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="pb-4">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="size-4" />
                {t('notes')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('placeholders.notes')}
                rows={3}
                disabled={isSubmitting}
                className="mt-1.5"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.notes.length}/500 {tCommon('characters')}
              </p>
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t('updating') : t('update')}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
