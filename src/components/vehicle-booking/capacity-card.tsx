"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Gauge, Shield } from "lucide-react"
import type { DailyCapacity } from "@/types/vehicle-booking"

interface CapacityCardProps {
  capacity: DailyCapacity | null
  loading?: boolean
  allowOverride?: boolean
}

export function CapacityCard({ capacity, loading, allowOverride }: CapacityCardProps) {
  const t = useTranslations('vehicleBookings.capacity')

  // Format tons: remove decimal if zero, keep if non-zero
  const formatTons = (value: number): string => {
    const formatted = value % 1 === 0 ? Math.floor(value) : value.toFixed(1)
    return `${formatted} ${t('mt')}`
  }

  // Use backend-calculated data exclusively (no frontend calculations)
  const bookedBoxes = Number(capacity?.booked_boxes || 0)
  const receivedBoxes = Number(capacity?.received_boxes || 0)

  if (loading) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gauge className="size-5" />
            </div>
            <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="animate-pulse space-y-2">
            <div className="h-1.5 bg-muted rounded"></div>
            <div className="grid grid-cols-4 gap-2 pt-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!capacity) {
    return null
  }

  // Use backend-calculated remaining capacity and percentages (ensure numbers)
  const remainingBoxes = Number(capacity?.remaining_capacity_boxes || 0)
  const limitTons = Number(capacity?.daily_limit_tons || 0)
  const remainingTons = Number(capacity?.remaining_capacity_tons || 0)
  const totalBookedTons = Number(capacity?.total_booked_tons || 0)

  // Calculate usage percent based on TONS (not boxes) for accurate progress
  const usagePercent = limitTons > 0 ? (totalBookedTons / limitTons) * 100 : 0

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
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Gauge className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {allowOverride !== undefined && (
              <Badge
                variant="outline"
                className={`text-[10px] py-0.5 px-1.5 ${
                  allowOverride
                    ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400"
                }`}
              >
                <Shield className="size-2.5 mr-0.5" />
                {allowOverride ? t('overrideEnabled') : t('overrideDisabled')}
              </Badge>
            )}
            <Badge className={`${badgeColor} text-xs py-0.5`}>
              {usagePercent.toFixed(0)}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{t('usage')}</span>
            <span>
              {formatTons(Number(capacity?.total_booked_tons || 0))} / {formatTons(limitTons)}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid - Keep 4 columns in one row */}
        <div className="grid grid-cols-4 gap-2 pt-0.5">
          {/* Daily Limit */}
          <div className="flex flex-col items-center justify-center py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5 leading-tight">{t('limit')}</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none my-1">
              {formatTons(limitTons)}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {(capacity?.daily_limit_boxes || 0).toLocaleString()} {t('boxes')}
            </div>
          </div>

          {/* Booked */}
          <div className="flex flex-col items-center justify-center py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5 leading-tight">{t('booked')}</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none my-1">
              {formatTons(Number(capacity?.booked_tons || 0))}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {bookedBoxes.toLocaleString()} {t('boxes')}
            </div>
          </div>

          {/* Received */}
          <div className="flex flex-col items-center justify-center py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5 leading-tight">{t('received')}</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400 leading-none my-1">
              {formatTons(Number(capacity?.received_tons || 0))}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {receivedBoxes.toLocaleString()} {t('boxes')}
            </div>
          </div>

          {/* Remaining */}
          <div className="flex flex-col items-center justify-center py-1.5">
            <div className="text-[10px] text-muted-foreground mb-0.5 leading-tight">{t('remaining')}</div>
            <div className={`text-lg font-bold leading-none my-1 ${
              isDanger ? "text-red-600 dark:text-red-400" :
              isWarning ? "text-amber-600 dark:text-amber-400" :
              "text-gray-600 dark:text-gray-400"
            }`}>
              {formatTons(remainingTons)}
            </div>
            <div className={`text-[10px] leading-tight ${
              isDanger ? "text-red-600/80 dark:text-red-400/80" :
              isWarning ? "text-amber-600/80 dark:text-amber-400/80" :
              "text-muted-foreground"
            }`}>
              {remainingBoxes.toLocaleString()} {t('boxes')}
            </div>
          </div>
        </div>


        {/* Warning Message */}
        {isDanger && (
          <div className="flex items-start gap-2 p-2 border border-red-800 dark:border-red-800 rounded-lg">
            <AlertTriangle className="size-3.5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-red-600 dark:text-red-400 leading-tight">{t('exceeded')}</p>
              <p className="text-red-600/80 dark:text-red-400/80 text-[10px] leading-tight mt-1">
                {t('exceededDescription')}
              </p>
            </div>
          </div>
        )}

        {isWarning && !isDanger && (
          <div className="flex items-start gap-2 p-2 border border-amber-800 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-amber-600 dark:text-amber-400 leading-tight">{t('approaching')}</p>
              <p className="text-amber-600/80 dark:text-amber-400/80 text-[10px] leading-tight mt-1">
                {t('approachingDescription', { count: remainingBoxes })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
