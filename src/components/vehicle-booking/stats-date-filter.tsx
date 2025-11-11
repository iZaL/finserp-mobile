"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"

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

    </Card>
  )
}
