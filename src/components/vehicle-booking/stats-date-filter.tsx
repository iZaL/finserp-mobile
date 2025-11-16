"use client"

import * as React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { parse, format } from "date-fns"
import "./stats-date-filter.css"

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

  // Parse string datetime to Date objects
  const fromDate = parse(datetimeFrom, "yyyy-MM-dd'T'HH:mm", new Date())
  const toDate = parse(datetimeTo, "yyyy-MM-dd'T'HH:mm", new Date())

  const handleFromChange = (date: Date | null) => {
    if (!date) return
    const formatted = format(date, "yyyy-MM-dd'T'HH:mm")
    onDatetimeChange(formatted, datetimeTo)
  }

  const handleToChange = (date: Date | null) => {
    if (!date) return
    const formatted = format(date, "yyyy-MM-dd'T'HH:mm")
    onDatetimeChange(datetimeFrom, formatted)
  }

  return (
    <Card className="p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {/* From DateTime */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground">
            {t("from")}
          </Label>
          <DatePicker
            selected={fromDate}
            onChange={handleFromChange}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            wrapperClassName="w-full"
            calendarClassName="custom-datepicker"
            popperClassName="datepicker-popper"
            popperPlacement="bottom-start"
            showPopperArrow={false}
          />
        </div>

        {/* To DateTime */}
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-muted-foreground">
            {t("to")}
          </Label>
          <DatePicker
            selected={toDate}
            onChange={handleToChange}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            wrapperClassName="w-full"
            calendarClassName="custom-datepicker"
            popperClassName="datepicker-popper"
            popperPlacement="bottom-start"
            showPopperArrow={false}
          />
        </div>
      </div>
    </Card>
  )
}
