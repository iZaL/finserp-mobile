"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { format, subDays, startOfMonth, startOfDay, endOfDay, differenceInDays } from "date-fns"

export type DatePreset = "today" | "last7" | "last30" | "thisMonth"

interface StatsDateFilterProps {
  datetimeFrom: string // Format: "2025-01-10T09:00"
  datetimeTo: string   // Format: "2025-01-10T18:00"
  onDatetimeChange: (datetimeFrom: string, datetimeTo: string) => void
}

export function StatsDateFilter({
  datetimeFrom,
  datetimeTo,
  onDatetimeChange,
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
        to = endOfDay(today)
        break
    }

    onDatetimeChange(
      format(from, "yyyy-MM-dd'T'HH:mm"),
      format(to, "yyyy-MM-dd'T'HH:mm")
    )
  }

  const getDayCount = () => {
    try {
      const from = new Date(datetimeFrom)
      const to = new Date(datetimeTo)
      return differenceInDays(to, from) + 1
    } catch {
      return 0
    }
  }

  return (
    <Card className="p-3 space-y-2">
      {/* Datetime Inputs - Combined Date + Time */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="datetime-from" className="text-[10px] font-medium text-muted-foreground">
            {t("from")}
          </Label>
          <Input
            id="datetime-from"
            type="datetime-local"
            value={datetimeFrom}
            onChange={(e) => onDatetimeChange(e.target.value, datetimeTo)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="datetime-to" className="text-[10px] font-medium text-muted-foreground">
            {t("to")}
          </Label>
          <Input
            id="datetime-to"
            type="datetime-local"
            value={datetimeTo}
            onChange={(e) => onDatetimeChange(datetimeFrom, e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("today")}
          className="text-xs h-7 px-2"
        >
          {t("today")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("last7")}
          className="text-xs h-7 px-2"
        >
          7D
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("last30")}
          className="text-xs h-7 px-2"
        >
          30D
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePreset("thisMonth")}
          className="text-xs h-7 px-2"
        >
          {t("thisMonth")}
        </Button>
      </div>

      {/* Info Text - Compact */}
      {getDayCount() > 0 && (
        <div className="text-center text-[10px] text-muted-foreground">
          {t("showingStatsForDays", { days: getDayCount() })}
        </div>
      )}
    </Card>
  )
}
