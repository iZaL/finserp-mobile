"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import type { DailyStats } from "@/types/vehicle-booking"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface DailyStatsListProps {
  dailyStats: DailyStats[]
  locale?: string
  onDayClick?: (date: string) => void
}

export function DailyStatsList({ dailyStats, locale = "en", onDayClick }: DailyStatsListProps) {
  const t = useTranslations("vehicleBookings.rangeStats")

  if (!dailyStats || dailyStats.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("noDailyStats")}</p>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "EEE, MMM d, yyyy", {
      locale: locale === "ar" ? ar : undefined,
    })
  }

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return t("noData")
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t("mins")}`
    }
    return `${hours.toFixed(1)} ${t("hrs")}`
  }

  const getCapacityVariant = (percent: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percent >= 100) return "destructive"
    if (percent >= 80) return "secondary"
    return "default"
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold px-1">{t("dailyBreakdown")}</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {dailyStats.map((day) => (
          <Card
            key={day.date}
            className="p-2.5 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onDayClick?.(day.date)}
          >
            {/* Date Header */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-xs leading-tight">{formatDate(day.date)}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {day.booking_count} {t("bookings")}
                </p>
              </div>
              <Badge variant={getCapacityVariant(day.capacity_percent)} className="text-[10px] h-5 px-1.5 shrink-0">
                {Math.round(day.capacity_percent)}%
              </Badge>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-[10px]">
              {/* Wait Time */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t("wait")}:</span>
                <span className="font-medium">{formatHours(day.avg_wait_hours)}</span>
              </div>

              {/* Status Breakdown */}
              <div className="flex items-center gap-2 ml-auto">
                {day.status_breakdown.exited > 0 && (
                  <span className="text-green-600">
                    ✓ {day.status_breakdown.exited}
                  </span>
                )}
                {day.status_breakdown.received > 0 && (
                  <span className="text-blue-600">
                    → {day.status_breakdown.received}
                  </span>
                )}
                {day.status_breakdown.booked > 0 && (
                  <span className="text-amber-600">
                    ⊙ {day.status_breakdown.booked}
                  </span>
                )}
                {day.status_breakdown.rejected > 0 && (
                  <span className="text-red-600">
                    ✗ {day.status_breakdown.rejected}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
