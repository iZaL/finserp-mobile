"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Settings2, Package, ChevronRight, Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const t = useTranslations()
  const [boxLimit, setBoxLimit] = useState<number>(5000)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [defaultBoxWeight, setDefaultBoxWeight] = useState<number>(20)
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    try {
      setIsFetching(true)

      // Get general settings for default box weight
      const settingsResponse = await api.get("/fish-purchase-vehicles/settings")
      if (settingsResponse.data?.data?.default_box_weight_kg) {
        setDefaultBoxWeight(settingsResponse.data.data.default_box_weight_kg)
      }

      // Get daily capacity for today
      const today = new Date().toISOString().split("T")[0]
      const capacityResponse = await api.get(`/fish-purchase-vehicles/daily-capacity?date=${today}`)

      if (capacityResponse.data?.data) {
        setBoxLimit(capacityResponse.data.data.daily_limit_boxes || 5000)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const calculateTons = (boxes: number): number => {
    return parseFloat(((boxes * defaultBoxWeight) / 1000).toFixed(2))
  }

  const handleUpdateLimit = async () => {
    if (boxLimit < 1) {
      toast.error(t("settings.validation.boxLimitMin"))
      return
    }

    try {
      setIsLoading(true)

      const today = new Date().toISOString().split("T")[0]
      const calculatedTons = calculateTons(boxLimit)

      await api.post("/fish-purchase-vehicles/daily-limit", {
        date: today,
        box_limit: boxLimit,
        ton_limit: calculatedTons,
        allow_override: true
      })

      toast.success(t("settings.dailyLimit.updateSuccess"))
      setShowLimitDialog(false)
      fetchSettings()
    } catch (error) {
      console.error("Failed to update daily limit:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Settings2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-card border rounded-lg divide-y">
          {/* Daily Limit Menu Item */}
          <button
            onClick={() => setShowLimitDialog(true)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors"
            disabled={isFetching}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-start">
                <div className="font-medium">{t("settings.dailyLimit.title")}</div>
                {isFetching ? (
                  <div className="text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {calculateTons(boxLimit).toLocaleString()} {t("vehicleBookings.newBookingForm.tons")} ({boxLimit.toLocaleString()} {t("vehicleBookings.capacity.boxes")})
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Future settings items can go here */}
          {/* Example placeholder */}
          <div className="px-4 py-4 flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-start">
                <div className="font-medium">{t("settings.moreSettings.title")}</div>
                <div className="text-sm text-muted-foreground">{t("settings.moreSettings.description")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Limit Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t("settings.dailyLimit.updateButton")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.dailyLimit.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Box Limit Input */}
            <div className="space-y-2">
              <Label htmlFor="box-limit" className="text-sm font-medium">
                {t("settings.dailyLimit.boxLimit")}
              </Label>
              <div className="relative">
                <Input
                  id="box-limit"
                  type="number"
                  value={boxLimit || ""}
                  onChange={(e) => setBoxLimit(parseInt(e.target.value) || 0)}
                  placeholder={t("settings.dailyLimit.boxLimitPlaceholder")}
                  className="h-12 text-lg pe-16"
                  disabled={isLoading}
                  min={1}
                  max={50000}
                  autoFocus
                />
                <div className="absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  {t("vehicleBookings.capacity.boxes")}
                </div>
              </div>
              {boxLimit > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {calculateTons(boxLimit).toLocaleString()} {t("vehicleBookings.newBookingForm.tons")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLimitDialog(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpdateLimit}
              disabled={isLoading || boxLimit < 1}
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("settings.dailyLimit.updating")}
                </>
              ) : (
                t("settings.dailyLimit.updateButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
