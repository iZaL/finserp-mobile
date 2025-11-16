"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatsKPICard } from "./stats-kpi-card"
import { ChevronDown, ChevronUp, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RangeStats } from "@/types/vehicle-booking"

interface AdvancedStatsCardsProps {
  stats: RangeStats | undefined
  isLoading?: boolean
}

export function AdvancedStatsCards({ stats, isLoading }: AdvancedStatsCardsProps) {
  const t = useTranslations("vehicleBookings.rangeStats")
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading || !stats) {
    return (
      <div className="space-y-3">
        {/* Show More Button Skeleton */}
        <div className="flex justify-center">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
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

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0%"
    return `${Math.round(value)}%`
  }

  return (
    <div className="space-y-3">
      {/* Show More/Less Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? (
            <>
              {t("showLess")}
              <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              {t("showAdvanced")}
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Advanced Stats (Collapsible) */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Offloading & Exit Times */}
          <div className="grid grid-cols-2 gap-3">
            <StatsKPICard
              icon={<Clock className="h-4 w-4" />}
              title={t("offloadingTimeTitle")}
              value={formatHours(stats.avg_offloading_time_hours)}
              subtitle={t("avgOffloadingDuration")}
              badge={
                (stats.avg_offloading_time_hours ?? 0) > 2
                  ? { label: t("slow"), variant: "destructive" }
                  : (stats.avg_offloading_time_hours ?? 0) > 1
                  ? { label: t("normal"), variant: "secondary" }
                  : { label: t("fast"), variant: "default" }
              }
            />

            <StatsKPICard
              icon={<Clock className="h-4 w-4" />}
              title={t("exitWaitTime")}
              value={formatHours(stats.avg_exit_wait_time_hours)}
              subtitle={t("avgExitWaitDuration")}
              badge={
                (stats.avg_exit_wait_time_hours ?? 0) > 0.5
                  ? { label: t("high"), variant: "destructive" }
                  : { label: t("good"), variant: "default" }
              }
            />
          </div>

          {/* Peak Hour & Supplier Insights */}
          <div className="grid grid-cols-2 gap-3">
            <StatsKPICard
              icon={<TrendingUp className="h-4 w-4" />}
              title={t("peakHour")}
              value={stats.peak_hour || t("noData")}
              subtitle={t("busiestTimeOfDay")}
            />

            <StatsKPICard
              icon={<Users className="h-4 w-4" />}
              title={t("topSupplier")}
              value={stats.busiest_supplier || t("noData")}
              subtitle={t("mostActiveSupplier")}
            />
          </div>

          {/* Box Variance & Total Cycle Time */}
          <div className="grid grid-cols-2 gap-3">
            <StatsKPICard
              icon={<AlertTriangle className="h-4 w-4" />}
              title={t("boxVariance")}
              value={formatPercent(stats.box_variance_percentage)}
              subtitle={t("actualVsPlannedBoxes")}
              badge={
                (stats.box_variance_percentage ?? 0) > 15
                  ? { label: t("high"), variant: "destructive" }
                  : (stats.box_variance_percentage ?? 0) > 5
                  ? { label: t("moderate"), variant: "secondary" }
                  : { label: t("low"), variant: "default" }
              }
            />

            <StatsKPICard
              icon={<Clock className="h-4 w-4" />}
              title={t("totalCycleTime")}
              value={formatHours(stats.avg_total_cycle_hours)}
              subtitle={t("avgTotalDuration")}
            />
          </div>

          {/* Rejection Rate & Performance Summary */}
          <div className="grid grid-cols-2 gap-3">
            <StatsKPICard
              icon={<AlertTriangle className="h-4 w-4" />}
              title={t("rejectionRate")}
              value={formatPercent(stats.rejection_rate_percent)}
              subtitle={t("vehiclesRejected")}
              badge={
                stats.rejection_rate_percent > 10
                  ? { label: t("high"), variant: "destructive" }
                  : stats.rejection_rate_percent > 5
                  ? { label: t("moderate"), variant: "secondary" }
                  : { label: t("low"), variant: "default" }
              }
            />

            <StatsKPICard
              icon={<TrendingUp className="h-4 w-4" />}
              title={t("completionRate")}
              value={formatPercent(stats.completion_rate_percent)}
              subtitle={t("vehiclesCompleted")}
              badge={
                stats.completion_rate_percent >= 95
                  ? { label: t("excellent"), variant: "default" }
                  : stats.completion_rate_percent >= 85
                  ? { label: t("good"), variant: "secondary" }
                  : { label: t("needsImprovement"), variant: "destructive" }
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}