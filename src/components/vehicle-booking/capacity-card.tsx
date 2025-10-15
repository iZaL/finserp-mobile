"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Gauge } from "lucide-react"
import type { DailyCapacity } from "@/types/vehicle-booking"

interface CapacityCardProps {
  capacity: DailyCapacity | null
  loading?: boolean
}

export function CapacityCard({ capacity, loading }: CapacityCardProps) {
  const t = useTranslations('vehicleBookings.capacity')
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
            <div className="h-2 bg-gray-700 rounded"></div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
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

  const usagePercent = capacity.capacity_used_percent
  const isWarning = usagePercent >= 80 && usagePercent < 100
  const isDanger = usagePercent >= 100
  const isNormal = usagePercent < 80

  // Determine color scheme
  let progressColor = "bg-green-600"
  let badgeVariant = "default"
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
          <Badge className={badgeColor}>
            {usagePercent.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('usage')}</span>
            <span>
              {capacity.total_booked_boxes} / {capacity.daily_limit_boxes} {t('boxes')}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
          </div>

          {/* Booked */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('booked')}</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {capacity.total_booked_boxes.toLocaleString()}
            </div>
          </div>

          {/* Received */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('received')}</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {capacity.total_received_boxes.toLocaleString()}
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
              {capacity.remaining_capacity_boxes.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {isDanger && (
          <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-800 rounded-lg">
            <AlertTriangle className="size-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-400">{t('exceeded')}</p>
              <p className="text-red-500 text-xs">
                {t('exceededDescription')}
              </p>
            </div>
          </div>
        )}

        {isWarning && !isDanger && (
          <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
            <AlertTriangle className="size-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">{t('approaching')}</p>
              <p className="text-amber-500 text-xs">
                {t('approachingDescription', { count: capacity.remaining_capacity_boxes })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
