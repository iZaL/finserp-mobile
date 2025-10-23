"use client"

import * as React from "react"
import { StatsKPICard } from "./stats-kpi-card"
import { Clock, CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RangeStats } from "@/types/vehicle-booking"

interface PerformanceStatsCardsProps {
  stats: RangeStats | null
  isLoading?: boolean
}

export function PerformanceStatsCards({ stats, isLoading }: PerformanceStatsCardsProps) {
  const t = useTranslations("vehicleBookings.rangeStats")

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return t("noData")
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t("mins")}`
    }
    return `${hours.toFixed(1)} ${t("hrs")}`
  }

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`
  }

  const getWaitTimeTrend = () => {
    if (stats.vs_previous_period?.wait_time_change_percent !== undefined) {
      return {
        value: stats.vs_previous_period.wait_time_change_percent,
        label: t("vsPrevious"),
      }
    }
    return undefined
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Card 1: Wait Times */}
      <StatsKPICard
        icon={<Clock className="h-4 w-4" />}
        title={t("waitTimes")}
        value={formatHours(stats.avg_wait_time_hours)}
        subtitle={
          stats.avg_processing_time_hours
            ? t("processingTime", {
                time: formatHours(stats.avg_processing_time_hours),
              })
            : undefined
        }
        trend={getWaitTimeTrend()}
      />

      {/* Card 2: Throughput */}
      <StatsKPICard
        icon={<CheckCircle2 className="h-4 w-4" />}
        title={t("throughput")}
        value={stats.completed_vehicles.toLocaleString()}
        subtitle={t("vehiclesCompleted")}
        badge={{
          label: formatPercent(stats.completion_rate_percent),
          variant: stats.completion_rate_percent >= 80 ? "default" : "secondary",
        }}
      />
    </div>
  )
}
