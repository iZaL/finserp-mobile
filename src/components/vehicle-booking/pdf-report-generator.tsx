"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Share, Eye, FileSpreadsheet, ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"
import type { RangeStats } from "@/types/vehicle-booking"
import { format } from "date-fns"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import { downloadFile } from "@/lib/utils/file-download"
import { toast } from "sonner"

interface PdfReportGeneratorProps {
  stats: RangeStats | undefined
  dateRange: {
    from: string
    to: string
  }
  isLoading?: boolean
}

export function PdfReportGenerator({ stats, dateRange, isLoading }: PdfReportGeneratorProps) {
  const t = useTranslations("vehicleBookings.reports")
  const tStats = useTranslations("vehicleBookings.rangeStats")
  const [downloading, setDownloading] = useState<string | null>(null)

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined || isNaN(Number(hours))) return tStats("noData")
    const numHours = Number(hours)
    if (numHours < 1) {
      return `${Math.round(numHours * 60)} ${tStats("mins")}`
    }
    return `${numHours.toFixed(1)} ${tStats("hrs")}`
  }

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined || isNaN(Number(value))) return "0%"
    return `${Math.round(Number(value))}%`
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0
    return Number(value)
  }


  const handleViewReport = () => {
    if (!stats) return

    setDownloading("view")

    try {
      // Create HTML content optimized for mobile viewing (simplified version)
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Vehicle Booking Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; font-size: 14px; line-height: 1.5; color: #333; background: #fff; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #1f2937; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
            .metric-value { font-size: 20px; font-weight: bold; color: #1f2937; }
            .metric-subtitle { font-size: 11px; color: #6b7280; margin-top: 3px; }
            @media print { body { margin: 0; padding: 15px; font-size: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Vehicle Booking Report</div>
            <div class="subtitle">${format(new Date(dateRange.from), "MMM d, yyyy")} - ${format(new Date(dateRange.to), "MMM d, yyyy")}</div>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Vehicles</div>
              <div class="metric-value">${formatNumber(stats.total_vehicles).toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Completed</div>
              <div class="metric-value">${formatNumber(stats.completed_vehicles).toLocaleString()}</div>
              <div class="metric-subtitle">${formatPercent(stats.completion_rate_percent)} completion rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Weight</div>
              <div class="metric-value">${formatNumber(stats.total_tons).toFixed(1)} MT</div>
              <div class="metric-subtitle">${formatNumber(stats.total_boxes).toLocaleString()} boxes</div>
            </div>
          </div>
        </body>
        </html>
      `

      const reportWindow = window.open('', '_blank')
      if (reportWindow) {
        reportWindow.document.write(reportContent)
        reportWindow.document.close()
        setTimeout(() => reportWindow.focus(), 100)
      }

    } catch (error) {
      console.error("Error generating report:", error)
      toast.error(t("downloadError"))
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadPdf = async () => {
    if (!stats) return

    setDownloading("pdf")
    try {
      const blob = await vehicleBookingService.exportReportPdf(dateRange.from, dateRange.to)
      const filename = `vehicle-booking-report-${format(new Date(dateRange.from), "ddMMyyyy")}-${format(new Date(dateRange.to), "ddMMyyyy")}.pdf`
      downloadFile(blob, filename, 'application/pdf')
      toast.success(t("downloadSuccess"))
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error(t("downloadError"))
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadExcel = async () => {
    if (!stats) return

    setDownloading("excel")
    try {
      const blob = await vehicleBookingService.exportReportExcel(dateRange.from, dateRange.to)
      const filename = `vehicle-booking-report-${format(new Date(dateRange.from), "ddMMyyyy")}-${format(new Date(dateRange.to), "ddMMyyyy")}.xlsx`
      downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      toast.success(t("downloadSuccess"))
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast.error(t("downloadError"))
    } finally {
      setDownloading(null)
    }
  }

  const shareReport = async () => {
    if (!stats) return

    const reportData = {
      title: `Vehicle Booking Report (${format(new Date(dateRange.from), "MMM d")} - ${format(new Date(dateRange.to), "MMM d")})`,
      text: `Vehicle Booking Performance Report\n\n` +
            `📊 Total Vehicles: ${formatNumber(stats.total_vehicles)}\n` +
            `✅ Completed: ${formatNumber(stats.completed_vehicles)} (${formatPercent(stats.completion_rate_percent)})\n` +
            `❌ Rejected: ${formatNumber(stats.rejected_vehicles)} (${formatPercent(stats.rejection_rate_percent)})\n` +
            `⏱️ Avg Wait Time: ${formatHours(stats.avg_wait_time_hours)}\n` +
            `🚛 Avg Offloading: ${formatHours(stats.avg_offloading_time_hours)}\n` +
            `📈 Capacity Utilization: ${formatPercent(stats.avg_capacity_percent)}\n\n` +
            `Generated on ${format(new Date(), "MMM d, yyyy")}`
    }

    if (navigator.share) {
      try {
        await navigator.share(reportData)
      } catch (error) {
        console.log("Share cancelled or failed:", error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(reportData.text)
        // You could show a toast here
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
      }
    }
  }

  if (isLoading || !stats) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-muted animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-32" />
            <div className="h-3 bg-muted animate-pulse rounded w-48" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-blue-100 dark:bg-blue-900">
            <FileText className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t("generateReport")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("reportDescription", {
                count: formatNumber(stats.total_vehicles),
                from: format(new Date(dateRange.from), "MMM d"),
                to: format(new Date(dateRange.to), "MMM d")
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shareReport}
            className="text-xs"
          >
            <Share className="h-3 w-3 mr-1" />
            {t("shareReport")}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={downloading !== null}
                size="sm"
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                {downloading ? t("downloading") : t("exportOptions")}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleViewReport} disabled={downloading === "view"}>
                <Eye className="h-4 w-4 mr-2" />
                {downloading === "view" ? t("downloading") : t("viewReport")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownloadPdf} disabled={downloading === "pdf"}>
                <FileText className="h-4 w-4 mr-2" />
                {downloading === "pdf" ? t("downloading") : t("downloadPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadExcel} disabled={downloading === "excel"}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {downloading === "excel" ? t("downloading") : t("downloadExcel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}