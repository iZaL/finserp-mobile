"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

export type DatePreset = "today" | "last7" | "last30" | "thisMonth"

interface StatsDateFilterProps {
  dateFrom: string
  dateTo: string
  onDateChange: (dateFrom: string, dateTo: string) => void
}

export function StatsDateFilter({
  dateFrom,
  dateTo,
  onDateChange,
}: StatsDateFilterProps) {
  const t = useTranslations("vehicleBookings.rangeStats")

  const handlePreset = (preset: DatePreset) => {
    const today = new Date()
    let from: Date
    let to: Date

    switch (preset) {
      case "today":
        from = startOfDay(today)
        to = endOfDay(today)
        break
      case "last7":
        from = startOfDay(subDays(today, 6))
        to = endOfDay(today)
        break
      case "last30":
        from = startOfDay(subDays(today, 29))
        to = endOfDay(today)
        break
      case "thisMonth":
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
    }

    onDateChange(
      format(from, "yyyy-MM-dd"),
      format(to, "yyyy-MM-dd")
    )
  }

  const getDayCount = () => {
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    const diffTime = Math.abs(to.getTime() - from.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date-from" className="text-xs">
            {t("from")}
          </Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateChange(e.target.value, dateTo)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-to" className="text-xs">
            {t("to")}
          </Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateChange(dateFrom, e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("today")}
          className="text-xs"
        >
          {t("today")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("last7")}
          className="text-xs"
        >
          {t("last7Days")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("last30")}
          className="text-xs"
        >
          {t("last30Days")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("thisMonth")}
          className="text-xs"
        >
          {t("thisMonth")}
        </Button>
      </div>

      {/* Info Text */}
      <div className="text-center text-xs text-muted-foreground">
        {t("showingStatsForDays", { days: getDayCount() })}
      </div>
    </Card>
  )
}
