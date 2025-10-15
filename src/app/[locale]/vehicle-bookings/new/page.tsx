"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, AlertTriangle, Zap, ArrowLeft, Loader2 } from "lucide-react"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleTemplate, DailyCapacity, VehicleBookingSettings } from "@/types/vehicle-booking"
import { toast } from "sonner"

export default function NewBookingPage() {
  const router = useRouter()
  const t = useTranslations('vehicleBookings.newBookingForm')
  const tCommon = useTranslations('common')
  const tValidation = useTranslations('vehicleBookings.validation')
  const vehicleNumberRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Form state
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [boxCount, setBoxCount] = useState("")
  const [boxWeightKg, setBoxWeightKg] = useState("")
  const [totalWeightTons, setTotalWeightTons] = useState("")
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [supplierPhone, setSupplierPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [allowOverride, setAllowOverride] = useState(false)

  // UI state
  const [suggestions, setSuggestions] = useState<VehicleTemplate[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [quickPicks, setQuickPicks] = useState<VehicleTemplate[]>([])
  const [capacityInfo, setCapacityInfo] = useState<DailyCapacity | null>(null)
  const [settings, setSettings] = useState<VehicleBookingSettings | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showCapacityDialog, setShowCapacityDialog] = useState(false)

  // Fetch quick picks and capacity info on mount
  useEffect(() => {
    fetchInitialData()
    vehicleNumberRef.current?.focus()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [picksData, capacityData, settingsData] = await Promise.all([
        vehicleBookingService.getQuickPicks(),
        vehicleBookingService.getDailyCapacity(),
        vehicleBookingService.getSettings(),
      ])
      setQuickPicks(picksData)
      setCapacityInfo(capacityData)
      setSettings(settingsData)

      // Set initial box weight from settings
      setBoxWeightKg(settingsData.default_box_weight_kg.toString())
    } catch (error) {
      console.error("Error fetching initial data:", error)
      // Fallback to default if fetching fails
      setBoxWeightKg("20")
    }
  }

  // Calculate total weight
  const calculateTotalWeight = useCallback((boxes: number, weightKg: number): string => {
    if (boxes <= 0 || weightKg <= 0) return ""
    const totalTons = (boxes * weightKg) / 1000
    return totalTons.toFixed(3)
  }, [])

  // Handle box count change
  const handleBoxCountChange = (value: string) => {
    setBoxCount(value)
    const boxes = parseInt(value) || 0
    const weight = parseFloat(boxWeightKg) || 0
    setTotalWeightTons(calculateTotalWeight(boxes, weight))
  }

  // Handle box weight change
  const handleBoxWeightChange = (value: string) => {
    setBoxWeightKg(value)
    const boxes = parseInt(boxCount) || 0
    const weight = parseFloat(value) || 0
    setTotalWeightTons(calculateTotalWeight(boxes, weight))
  }

  // Autocomplete with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const query = vehicleNumber.trim()
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await vehicleBookingService.getSuggestions(query)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [vehicleNumber])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!vehicleNumberRef.current) return
      const container = vehicleNumberRef.current.closest(".vehicle-number-container")
      if (container && e.target instanceof Node && !container.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // Apply suggestion
  const applySuggestion = (suggestion: VehicleTemplate) => {
    setVehicleNumber(suggestion.vehicle_number)
    setBoxCount(suggestion.box_count.toString())
    setBoxWeightKg(suggestion.box_weight_kg.toString())
    setTotalWeightTons(suggestion.weight_tons.toFixed(3))
    setShowSuggestions(false)

    // Focus box count after a brief delay
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('[name="box_count"]')?.focus()
    }, 100)
  }

  // Form validation
  const validateForm = (): boolean => {
    if (!vehicleNumber.trim()) {
      toast.error(tValidation('vehicleNumberRequired'))
      return false
    }

    const boxes = parseInt(boxCount) || 0
    const weight = parseFloat(boxWeightKg) || 0

    if (boxes <= 0) {
      toast.error(tValidation('boxCountRequired'))
      return false
    }

    if (boxes > 10000) {
      toast.error(tValidation('boxCountMax'))
      return false
    }

    if (weight <= 0) {
      toast.error(tValidation('boxWeightRequired'))
      return false
    }

    if (weight < 1) {
      toast.error(tValidation('boxWeightMin'))
      return false
    }

    if (weight > 1000) {
      toast.error(tValidation('boxWeightMax'))
      return false
    }

    return true
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const boxes = parseInt(boxCount) || 0
    const remainingCapacity = capacityInfo?.remaining_capacity_boxes || 0
    const willExceed = boxes > remainingCapacity && remainingCapacity > 0

    // Show capacity dialog if exceeding
    if (willExceed && !allowOverride) {
      setShowCapacityDialog(true)
      return
    }

    await submitForm()
  }

  const submitForm = async () => {
    try {
      setSubmitting(true)
      await vehicleBookingService.createBooking({
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        box_count: parseInt(boxCount),
        box_weight_kg: parseFloat(boxWeightKg),
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        supplier_name: supplierName.trim() || undefined,
        supplier_phone: supplierPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        allow_override: allowOverride,
      })

      toast.success(t('vehicleAdded', { number: vehicleNumber }))

      // Reset form
      setVehicleNumber("")
      setBoxCount("")
      setBoxWeightKg(settings?.default_box_weight_kg.toString() || "20")
      setTotalWeightTons("")
      setDriverName("")
      setDriverPhone("")
      setSupplierName("")
      setSupplierPhone("")
      setNotes("")
      setAllowOverride(false)
      setShowCapacityDialog(false)

      // Refresh capacity info
      const newCapacity = await vehicleBookingService.getDailyCapacity()
      setCapacityInfo(newCapacity)

      // Focus on vehicle number
      setTimeout(() => vehicleNumberRef.current?.focus(), 100)
    } catch (error) {
      console.error("Error creating booking:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCapacityProceed = () => {
    setAllowOverride(true)
    setShowCapacityDialog(false)
    submitForm()
  }

  const boxes = parseInt(boxCount) || 0
  const remainingCapacity = capacityInfo?.remaining_capacity_boxes || 0
  const isCapacityWarning = boxes > remainingCapacity && remainingCapacity > 0
  const exceeding = boxes - remainingCapacity

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-blue-600 dark:text-blue-400" />
            {t('quickEntry')}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Quick Picks */}
          {quickPicks.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">{t('quickPicks')}</div>
              <div className="flex flex-wrap gap-2">
                {quickPicks.slice(0, 8).map((pick, idx) => (
                  <Badge
                    key={`${pick.vehicle_number}-${idx}`}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => applySuggestion(pick)}
                  >
                    {pick.vehicle_number}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Number with Autocomplete */}
            <div className="vehicle-number-container">
              <Label htmlFor="vehicle_number">
                {t('vehicleNumber')} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  ref={vehicleNumberRef}
                  id="vehicle_number"
                  name="vehicle_number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder={t('placeholders.vehicleNumber')}
                  className="pr-10"
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-popover text-popover-foreground border border-border rounded-md shadow-md max-h-60 overflow-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.vehicle_number}-${idx}`}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{suggestion.vehicle_number}</span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.box_count} {t('boxes', { ns: 'vehicleBookings.capacity' })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Box Count, Weight, Total Weight */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="box_count">
                  {t('boxCount')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="box_count"
                  name="box_count"
                  type="number"
                  value={boxCount}
                  onChange={(e) => handleBoxCountChange(e.target.value)}
                  placeholder={t('placeholders.boxCount')}
                  min="0"
                  max="10000"
                />
              </div>

              <div>
                <Label htmlFor="box_weight_kg">
                  {t('boxWeight')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="box_weight_kg"
                  name="box_weight_kg"
                  type="number"
                  step="0.1"
                  value={boxWeightKg}
                  onChange={(e) => handleBoxWeightChange(e.target.value)}
                  placeholder={t('placeholders.boxWeight')}
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <Label htmlFor="total_weight_tons">{t('totalWeight')}</Label>
                <Input
                  id="total_weight_tons"
                  name="total_weight_tons"
                  type="text"
                  value={totalWeightTons}
                  placeholder="0.000"
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
            </div>

            {/* Capacity Warning */}
            {isCapacityWarning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-400">{t('capacityWarning')}</p>
                    <p className="text-amber-700 dark:text-amber-500">
                      {t('willExceedBy', { count: exceeding })}
                    </p>
                  </div>
                </div>

                {capacityInfo?.can_override && (
                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox
                      id="allow_override"
                      checked={allowOverride}
                      onCheckedChange={(checked) => setAllowOverride(checked as boolean)}
                    />
                    <Label htmlFor="allow_override" className="text-sm text-amber-700 dark:text-amber-500 cursor-pointer">
                      {t('allowOverride')}
                    </Label>
                  </div>
                )}
              </div>
            )}

            {/* Supplier Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="supplier_name">{t('supplierName')}</Label>
                <Input
                  id="supplier_name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder={tCommon('optional')}
                />
              </div>

              <div>
                <Label htmlFor="supplier_phone">{t('supplierPhone')}</Label>
                <Input
                  id="supplier_phone"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder={tCommon('optional')}
                />
              </div>
            </div>

{/* Driver Details */}
<div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="driver_name">{t('driverName')}</Label>
                <Input
                  id="driver_name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder={tCommon('optional')}
                />
              </div>

              <div>
                <Label htmlFor="driver_phone">{t('driverPhone')}</Label>
                <Input
                  id="driver_phone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder={tCommon('optional')}
                />
              </div>
            </div>
            {/* Notes */}
            <div>
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('charactersCount', { count: notes.length })}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t('adding')}
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  {t('addVehicle')}
                  {isCapacityWarning && (
                    <AlertTriangle className="size-3 ml-2 text-amber-300" />
                  )}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Capacity Override Dialog */}
      <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              {t('capacityOverrideRequired')}
            </DialogTitle>
            <DialogDescription>
              {t('capacityOverrideDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('remaining')}</span>
                  <span className="font-medium">{remainingCapacity} {t('boxes', { ns: 'vehicleBookings.capacity' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('adding2')}</span>
                  <span className="font-medium">{boxes} {t('boxes', { ns: 'vehicleBookings.capacity' })} ({totalWeightTons} {t('tons', { ns: 'vehicleBookings.bookingCard' })})</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    +{exceeding}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('boxesOverLimit')}</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCapacityDialog(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCapacityProceed}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t('proceedWithOverride')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
