"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Gauge, Shield } from "lucide-react"
import type { DailyCapacity, VehicleBooking } from "@/types/vehicle-booking"

interface CapacityCardProps {
  capacity: DailyCapacity | null
  loading?: boolean
  allowOverride?: boolean
  bookings?: VehicleBooking[]
  defaultBoxWeightKg?: number
}

export function CapacityCard({ capacity, loading, allowOverride, bookings = [], defaultBoxWeightKg = 50 }: CapacityCardProps) {
  const t = useTranslations('vehicleBookings.capacity')

  // Calculate box counts and tonnage from bookings array for consistency
  // Only count vehicles that are using capacity (booked and received)

  // Booked: Approved vehicles waiting at gate (exclude pending approval and approval-rejected)
  const bookedBookings = bookings.filter(b =>
    b.status === "booked" &&
    !b.is_pending_approval &&
    b.approval_status !== "rejected"
  )
  const bookedBoxes = bookedBookings.reduce((sum, b) => sum + b.box_count, 0)
  const bookedTons = bookedBookings.reduce((sum, b) => sum + Number(b.weight_tons || 0), 0)

  // Received: Vehicles currently in factory being offloaded
  const receivedBookings = bookings.filter(b => b.status === "received")
  const receivedBoxes = receivedBookings.reduce((sum, b) => sum + (b.actual_box_count || b.box_count), 0)
  const receivedTons = receivedBookings.reduce((sum, b) => sum + Number(b.weight_tons || 0), 0)

  // Calculate totals and remaining capacity
  const totalUsedBoxes = bookedBoxes + receivedBoxes
  const totalUsedTons = bookedTons + receivedTons

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-2 bg-muted rounded"></div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!capacity) {
    return null
  }

  // Calculate remaining capacity and usage percentage
  const remainingBoxes = capacity.daily_limit_boxes - totalUsedBoxes
  // Use daily_limit_tons from backend if available, otherwise calculate as fallback
  const limitTons = capacity.daily_limit_tons != null
    ? Number(capacity.daily_limit_tons)
    : (capacity.daily_limit_boxes * defaultBoxWeightKg) / 1000
  const remainingTons = limitTons - totalUsedTons
  const usagePercent = capacity.daily_limit_boxes > 0 ? (totalUsedBoxes / capacity.daily_limit_boxes) * 100 : 0

  const isWarning = usagePercent >= 80 && usagePercent < 100
  const isDanger = usagePercent >= 100

  // Determine color scheme
  let progressColor = "bg-green-600"
  let badgeColor = "bg-green-600 text-white"

  if (isDanger) {
    progressColor = "bg-red-600"
    badgeColor = "bg-red-600 text-white"
  } else if (isWarning) {
    progressColor = "bg-amber-600"
    badgeColor = "bg-amber-600 text-white"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4 text-blue-600 dark:text-blue-400" />
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {allowOverride !== undefined && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  allowOverride
                    ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Shield className="size-3 mr-1" />
                {allowOverride ? t('overrideEnabled') : t('overrideDisabled')}
              </Badge>
            )}
            <Badge className={badgeColor}>
              {usagePercent.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('usage')}</span>
            <span>
              {totalUsedBoxes.toLocaleString()} / {capacity.daily_limit_boxes.toLocaleString()} {t('boxes')}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Daily Limit */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('limit')}</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {capacity.daily_limit_boxes.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {limitTons.toFixed(1)} {t('mt')}
            </div>
          </div>

          {/* Booked */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('booked')}</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {bookedBoxes.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {bookedTons.toFixed(1)} {t('mt')}
            </div>
          </div>

          {/* Received */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('received')}</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {receivedBoxes.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {receivedTons.toFixed(1)} {t('mt')}
            </div>
          </div>

          {/* Remaining */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('remaining')}</div>
            <div className={`text-lg font-bold ${
              isDanger ? "text-red-600 dark:text-red-400" :
              isWarning ? "text-amber-600 dark:text-amber-400" :
              "text-gray-600 dark:text-gray-400"
            }`}>
              {remainingBoxes.toLocaleString()}
            </div>
            <div className={`text-xs mt-0.5 ${
              isDanger ? "text-red-600/80 dark:text-red-400/80" :
              isWarning ? "text-amber-600/80 dark:text-amber-400/80" :
              "text-muted-foreground"
            }`}>
              {remainingTons.toFixed(1)} {t('mt')}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {isDanger && (
          <div className="flex items-start gap-2 p-3 border border-red-800 dark:border-red-800 rounded-lg">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-600 dark:text-red-400">{t('exceeded')}</p>
              <p className="text-red-600/80 dark:text-red-400/80 text-xs">
                {t('exceededDescription')}
              </p>
            </div>
          </div>
        )}

        {isWarning && !isDanger && (
          <div className="flex items-start gap-2 p-3 border border-amber-800 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">{t('approaching')}</p>
              <p className="text-amber-600/80 dark:text-amber-400/80 text-xs">
                {t('approachingDescription', { count: remainingBoxes })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
