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
import type { VehicleBooking } from "@/types/vehicle-booking"
import { Loader2, type LucideIcon } from "lucide-react"

/**
 * Generic form field configuration
 */
interface FormField {
  type: "textarea" | "select"
  name: string
  label: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  options?: string[] // For select fields
  showCharCount?: boolean
}

/**
 * Vehicle action dialog configuration
 */
interface VehicleActionConfig {
  title: string
  description: string
  icon: LucideIcon
  buttonText: string
  buttonLoadingText: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonClassName?: string
  warningMessage?: string
  infoMessage?: string
  formFields?: FormField[]
  showVehicleSummary?: boolean
  vehicleSummaryFields?: Array<{
    label: string
    value: (booking: VehicleBooking) => string | number | null | undefined
  }>
}

interface VehicleActionDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: Record<string, string>) => Promise<void>
  config: VehicleActionConfig
  isPending?: boolean
}

/**
 * Generic Vehicle Action Dialog
 *
 * A reusable dialog component for vehicle booking actions (receive, reject, exit, etc.)
 * Reduces code duplication across multiple similar dialog components.
 *
 * @example
 * ```tsx
 * <VehicleActionDialog
 *   booking={selectedBooking}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={async (data) => {
 *     await receiveMutation.mutateAsync({ id: booking.id, data })
 *   }}
 *   isPending={receiveMutation.isPending}
 *   config={{
 *     title: "Receive Vehicle",
 *     description: "Are you sure you want to receive this vehicle?",
 *     icon: CheckCircle,
 *     buttonText: "Receive Vehicle",
 *     buttonLoadingText: "Receiving...",
 *     showVehicleSummary: true
 *   }}
 * />
 * ```
 */
export function VehicleActionDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
  config,
  isPending = false,
}: VehicleActionDialogProps) {
  const tCommon = useTranslations("common")
  const [formData, setFormData] = useState<Record<string, string>>({})

  const Icon = config.icon

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setFormData({})
      }
    }
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking) return

    // Validate required fields
    const hasRequiredFields = config.formFields?.every((field) => {
      if (!field.required) return true
      return formData[field.name]?.trim()
    })

    if (!hasRequiredFields) return

    try {
      await onConfirm(formData)
      handleOpenChange(false)
    } catch (error) {
      // Error is already handled by the mutation hook with toast
      console.error(`Error in ${config.title}:`, error)
    }
  }

  if (!booking) return null

  const defaultVehicleSummaryFields = [
    { label: "Vehicle", value: (b: VehicleBooking) => b.vehicle_number },
    { label: "Boxes", value: (b: VehicleBooking) => b.box_count },
    { label: "Weight", value: (b: VehicleBooking) => `${Number(b.weight_tons || 0).toFixed(2)} tons` },
    { label: "Driver", value: (b: VehicleBooking) => b.driver_name },
  ]

  const summaryFields = config.vehicleSummaryFields || defaultVehicleSummaryFields

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Vehicle Summary */}
            {config.showVehicleSummary !== false && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {summaryFields.map((field, index) => {
                    const value = field.value(booking)
                    if (!value) return null
                    return (
                      <div key={index}>
                        <p className="text-muted-foreground text-xs">{field.label}</p>
                        <p className="font-medium">{value}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Form Fields */}
            {config.formFields?.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>

                {field.type === "textarea" ? (
                  <>
                    <Textarea
                      id={field.name}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      maxLength={field.maxLength}
                      required={field.required}
                    />
                    {field.showCharCount && field.maxLength && (
                      <p className="text-xs text-muted-foreground">
                        {(formData[field.name] || "").length} / {field.maxLength} characters
                      </p>
                    )}
                  </>
                ) : field.type === "select" ? (
                  <Select
                    value={formData[field.name] || ""}
                    onValueChange={(value) => handleFieldChange(field.name, value)}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            ))}

            {/* Warning Message */}
            {config.warningMessage && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  ⚠️ {config.warningMessage}
                </p>
              </div>
            )}

            {/* Info Message */}
            {config.infoMessage && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-3">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  ℹ️ {config.infoMessage}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant={config.buttonVariant || "default"}
              className={config.buttonClassName}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {config.buttonLoadingText}
                </>
              ) : (
                <>
                  <Icon className="size-4 mr-2" />
                  {config.buttonText}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
