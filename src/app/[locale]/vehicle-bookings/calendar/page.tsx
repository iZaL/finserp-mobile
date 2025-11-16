"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { VehicleBooking } from "@/types/vehicle-booking"
import { BookingCard } from "@/components/vehicle-booking/booking-card"
import { StatsDateFilter } from "@/components/vehicle-booking/stats-date-filter"
import { KeyMetricsCards } from "@/components/vehicle-booking/key-metrics-cards"
import { CapacityStatsCards } from "@/components/vehicle-booking/capacity-stats-cards"
import { PerformanceStatsCards } from "@/components/vehicle-booking/performance-stats-cards"
import { AdvancedStatsCards } from "@/components/vehicle-booking/advanced-stats-cards"
import { PdfReportGenerator } from "@/components/vehicle-booking/pdf-report-generator"
import { DailyStatsList } from "@/components/vehicle-booking/daily-stats-list"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, Weight, TrendingUp, Clock } from "lucide-react"
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog"
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog"
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog"
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog"
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog"
import { ApproveDialog } from "@/components/vehicle-booking/approve-dialog"
import { RejectApprovalDialog } from "@/components/vehicle-booking/reject-approval-dialog"
import { EditDialog } from "@/components/vehicle-booking/edit-dialog"
import { useRouter } from "@/i18n/navigation"
import { format } from "date-fns"
import { useVehicleBookings, useRangeStats } from "@/hooks/use-vehicle-bookings"
import { toast } from "sonner"

export default function CalendarViewPage() {
  const t = useTranslations("vehicleBookings")
  const tStats = useTranslations("vehicleBookings.rangeStats")
  const locale = useLocale()
  const isRTL = locale === "ar"
  const router = useRouter()
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<
    "all" | "booked" | "received" | "exited" | "rejected"
  >("all")

  // Stats state - Default to 8:00 AM today to 8:00 AM next day (24-hour period)
  const [statsDatetimeFrom, setStatsDatetimeFrom] = useState(() => {
    const today = new Date()
    return format(today, "yyyy-MM-dd'T'08:00")
  })
  const [statsDatetimeTo, setStatsDatetimeTo] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return format(tomorrow, "yyyy-MM-dd'T'08:00")
  })

  // Dialog states
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [unreceiveDialogOpen, setUnreceiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectApprovalDialogOpen, setRejectApprovalDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<VehicleBooking | null>(null)

  // React Query hooks - Fetch bookings for the selected date range
  // Note: This fetches ALL bookings, not filtered by offloading_completed_at
  // The range stats below use offloading_completed_at for filtering
  const {
    isLoading: bookingsLoading,
    refetch: refetchBookings,
    isFetching: isFetchingBookings,
  } = useVehicleBookings({
    date_from: statsDatetimeFrom.replace('T', ' ') + ':00',
    date_to: statsDatetimeTo.replace('T', ' ') + ':59',
    per_page: 1000, // Get all for the range
  })

  // Convert stats datetime to backend format and fetch
  const statsFrom = statsDatetimeFrom.replace("T", " ") + ":00"
  const statsTo = statsDatetimeTo.replace("T", " ") + ":59"
  const {
    data: rangeStats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useRangeStats(statsFrom, statsTo, true)

  const loading = bookingsLoading
  const isRefreshing = isFetchingBookings || isFetchingStats

  // Calculate tons per hour
  const tonsPerHour = useMemo(() => {
    if (!rangeStats || !rangeStats.total_tons_offloaded) return 0

    // Parse date range
    const startDate = new Date(statsFrom)
    const endDate = new Date(statsTo)
    const now = new Date()

    // If end date is in the future, cap it to current time
    const effectiveEndDate = endDate > now ? now : endDate

    // Calculate hours elapsed
    const hoursElapsed = (effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

    // Avoid division by zero
    if (hoursElapsed <= 0) return 0

    return rangeStats.total_tons_offloaded / hoursElapsed
  }, [rangeStats, statsFrom, statsTo])

  const handleStatsDatetimeChange = (from: string, to: string) => {
    setStatsDatetimeFrom(from)
    setStatsDatetimeTo(to)
  }

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchBookings(), refetchStats()])
      toast.success("Data refreshed successfully")
    } catch {
      toast.error("Failed to refresh data")
    }
  }

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth
    }
  }, [isRTL, sheetOpen])

  // Placeholder empty data - calendar functionality not implemented
  const selectedDateBookings: VehicleBooking[] = []
  const statusCounts = { all: 0, booked: 0, received: 0, exited: 0, rejected: 0 }

  // Action handlers
  const handleReceive = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setReceiveDialogOpen(true)
  }

  const handleReject = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setRejectDialogOpen(true)
  }

  const handleExit = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setExitDialogOpen(true)
  }

  const handleUnreceive = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setUnreceiveDialogOpen(true)
  }

  const handleEdit = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setEditDialogOpen(true)
  }

  const handleDelete = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setDeleteDialogOpen(true)
  }

  const handleApprove = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setApproveDialogOpen(true)
  }

  const handleRejectApproval = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setRejectApprovalDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    // React Query will automatically refetch after mutations
    // No manual refetch needed - data stays in sync automatically
  }

  // Loading skeleton
  if (loading || statsLoading) {
    return (
      <>
        <div className="flex items-center gap-2.5 mb-3">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">{tStats("pageTitle")}</h2>
            <p className="text-muted-foreground text-xs mt-0.5">{tStats("pageSubtitle")}</p>
          </div>
        </div>

        {/* Date Filter Skeleton */}
        <div className="rounded-xl border bg-card p-3 mb-3">
          <div className="h-16 bg-muted animate-pulse rounded" />
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Other Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Daily List Skeleton */}
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2.5 mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">{tStats("pageTitle")}</h2>
          <p className="text-muted-foreground text-xs mt-0.5 truncate">
            {tStats("pageSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Range Stats Section */}
      <div className="space-y-3">
        {/* Date & Time Filter */}
        <StatsDateFilter
          datetimeFrom={statsDatetimeFrom}
          datetimeTo={statsDatetimeTo}
          onDatetimeChange={handleStatsDatetimeChange}
        />

        {/* Key Business Metrics */}
        <KeyMetricsCards stats={rangeStats} isLoading={statsLoading} />

        {/* Capacity KPIs */}
        <CapacityStatsCards stats={rangeStats} isLoading={statsLoading} />

        {/* Performance KPIs */}
        <PerformanceStatsCards stats={rangeStats} isLoading={statsLoading} />

        {/* Advanced Stats (Collapsible) */}
        <AdvancedStatsCards stats={rangeStats} isLoading={statsLoading} />

        {/* PDF Report Generation */}
        <PdfReportGenerator
          stats={rangeStats}
          dateRange={{
            from: statsDatetimeFrom.split('T')[0],
            to: statsDatetimeTo.split('T')[0]
          }}
          isLoading={statsLoading}
        />

        {/* Daily Breakdown List */}
        {rangeStats?.daily_stats && rangeStats.daily_stats.length > 0 && (
          <DailyStatsList
            dailyStats={rangeStats.daily_stats}
            locale={locale}
            onDayClick={handleStatsDayClick}
          />
        )}
        {/* Simplified Metrics */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-muted animate-pulse rounded-lg" />
            <div className="h-28 bg-muted animate-pulse rounded-lg" />
            <div className="h-28 bg-muted animate-pulse rounded-lg" />
            <div className="h-28 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : rangeStats ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Total Vehicles Offloaded */}
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-background">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {tStats("completedVehicles")}
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {rangeStats.completed_vehicles.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-2">
                    <Truck className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Tons Offloaded */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-background">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {tStats("totalTons")}
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {(rangeStats.total_tons_offloaded ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-2">
                    <Weight className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tons Per Hour */}
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/50 dark:to-background">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {tStats("tonsPerHour")}
                    </p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {tonsPerHour.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-2">
                    <TrendingUp className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Processing Time (Received to Exited) */}
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-background">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {tStats("avgProcessingTime")}
                    </p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {rangeStats.avg_processing_time_hours !== null
                        ? rangeStats.avg_processing_time_hours.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        : "N/A"}
                      {rangeStats.avg_processing_time_hours !== null && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {tStats("hrs")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-2">
                    <Clock className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Day Bookings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>
              {/* Calendar view not implemented */}
            </SheetTitle>
            <SheetDescription>
              {tStats("bookingsOnDay", { count: statusCounts.all })}
            </SheetDescription>
          </SheetHeader>

          {/* Status Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            className="mt-4"
          >
            <div ref={tabsScrollRef} className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
              <TabsList
                className={`inline-flex w-auto h-auto ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <TabsTrigger value="all" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t("filters.all")}
                  {statusCounts.all > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="booked" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t("filters.booked")}
                  {statusCounts.booked > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.booked}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="received" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t("filters.received")}
                  {statusCounts.received > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.received}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="exited" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t("filters.exited")}
                  {statusCounts.exited > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.exited}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t("filters.rejected")}
                  {statusCounts.rejected > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(85vh-200px)]">
            {selectedDateBookings.length > 0 ? (
              selectedDateBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onReceive={handleReceive}
                  onReject={handleReject}
                  onExit={handleExit}
                  onUnreceive={handleUnreceive}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onRejectApproval={handleRejectApproval}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {statusFilter !== "all"
                  ? tStats("noBookingsWithStatus", { status: statusFilter })
                  : tStats("noBookingsEmpty")}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <ReceiveDialog
        booking={selectedBooking}
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <RejectDialog
        booking={selectedBooking}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <ExitDialog
        booking={selectedBooking}
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <UnreceiveDialog
        booking={selectedBooking}
        open={unreceiveDialogOpen}
        onOpenChange={setUnreceiveDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        booking={selectedBooking}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <ApproveDialog
        booking={selectedBooking}
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <RejectApprovalDialog
        booking={selectedBooking}
        open={rejectApprovalDialogOpen}
        onOpenChange={setRejectApprovalDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <EditDialog
        booking={selectedBooking}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}
