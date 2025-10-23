"use client"

import * as React from "react"
import { StatsKPICard } from "./stats-kpi-card"
import { BarChart3, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RangeStats } from "@/types/vehicle-booking"

interface CapacityStatsCardsProps {
  stats: RangeStats | null
  isLoading?: boolean
}

export function CapacityStatsCards({ stats, isLoading }: CapacityStatsCardsProps) {
  const t = useTranslations("vehicleBookings.rangeStats")

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const getCapacityBadge = (percent: number) => {
    if (percent >= 100) {
      return { label: t("overCapacity"), variant: "destructive" as const }
    }
    if (percent >= 80) {
      return { label: t("warning"), variant: "secondary" as const }
    }
    return { label: t("efficient"), variant: "default" as const }
  }

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "0%"
    return `${Math.round(value)}%`
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Card 1: Capacity Utilization */}
      <StatsKPICard
        icon={<BarChart3 className="h-4 w-4" />}
        title={t("capacityUtilization")}
        value={formatPercent(stats.avg_capacity_percent)}
        subtitle={t("totalBoxes", {
          count: stats.total_boxes.toLocaleString()
        })}
        badge={getCapacityBadge(stats.avg_capacity_percent)}
      />

      {/* Card 2: Capacity Insights */}
      <StatsKPICard
        icon={<TrendingUp className="h-4 w-4" />}
        title={t("capacityInsights")}
        value={stats.over_capacity_days}
        subtitle={
          stats.peak_capacity_date
            ? t("peakDay", {
                date: new Date(stats.peak_capacity_date).toLocaleDateString(),
                percent: formatPercent(stats.peak_capacity_percent),
              })
            : t("noPeakData")
        }
        badge={
          stats.over_capacity_days > 0
            ? { label: t("daysOverCapacity"), variant: "destructive" }
            : undefined
        }
      />
    </div>
  )
}
