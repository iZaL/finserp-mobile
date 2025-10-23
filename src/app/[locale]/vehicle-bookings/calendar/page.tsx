"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  ArrowLeft,
  Loader2
} from "lucide-react"
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
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking, DailyCapacity, RangeStats } from "@/types/vehicle-booking"
import { BookingCard } from "@/components/vehicle-booking/booking-card"
import { StatsDateFilter } from "@/components/vehicle-booking/stats-date-filter"
import { CapacityStatsCards } from "@/components/vehicle-booking/capacity-stats-cards"
import { PerformanceStatsCards } from "@/components/vehicle-booking/performance-stats-cards"
import { DailyStatsList } from "@/components/vehicle-booking/daily-stats-list"
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog"
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog"
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog"
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog"
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog"
import { ApproveDialog } from "@/components/vehicle-booking/approve-dialog"
import { RejectApprovalDialog } from "@/components/vehicle-booking/reject-approval-dialog"
import { EditDialog } from "@/components/vehicle-booking/edit-dialog"
import { useRouter } from "@/i18n/navigation"
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"

interface DayCapacityInfo {
  totalBoxes: number
  capacityPercent: number
  hasPendingApprovals: boolean
}

export default function CalendarViewPage() {
  const t = useTranslations('vehicleBookings')
  const tStats = useTranslations('vehicleBookings.rangeStats')
  const locale = useLocale()
  const isRTL = locale === "ar"
  const router = useRouter()
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState<VehicleBooking[]>([])
  const [dailyCapacity, setDailyCapacity] = useState<DailyCapacity | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "booked" | "received" | "exited" | "rejected">("all")

  // Stats state
  const [rangeStats, setRangeStats] = useState<RangeStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsDateFrom, setStatsDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [statsDateTo, setStatsDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

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

  // Fetch bookings and capacity for the current month
  const fetchData = async (month: Date) => {
    try {
      setLoading(true)
      const start = format(startOfMonth(month), "yyyy-MM-dd")
      const end = format(endOfMonth(month), "yyyy-MM-dd")

      const [bookingsResponse, capacityResponse] = await Promise.all([
        vehicleBookingService.getBookings({
          date_from: start,
          date_to: end,
          per_page: 1000, // Get all for the month
        }),
        vehicleBookingService.getDailyCapacity(start)
      ])

      setBookings(bookingsResponse.data)
      setDailyCapacity(capacityResponse)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(currentMonth)
  }, [currentMonth])

  // Fetch range stats
  const fetchRangeStats = async (from: string, to: string) => {
    try {
      setStatsLoading(true)
      const stats = await vehicleBookingService.getRangeStats(from, to)
      setRangeStats(stats)
    } catch (error) {
      console.error("Error fetching range stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchRangeStats(statsDateFrom, statsDateTo)
  }, [statsDateFrom, statsDateTo])

  const handleStatsDateChange = (from: string, to: string) => {
    setStatsDateFrom(from)
    setStatsDateTo(to)
  }

  const handleStatsDayClick = (date: string) => {
    const clickedDate = new Date(date)
    setSelectedDate(clickedDate)
    setStatusFilter("all")
    setSheetOpen(true)

    // Update current month if clicked date is in a different month
    if (!isSameMonth(clickedDate, currentMonth)) {
      setCurrentMonth(clickedDate)
    }
  }

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth
    }
  }, [isRTL, sheetOpen])

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, VehicleBooking[]> = {}
    bookings.forEach((booking) => {
      const date = format(new Date(booking.entry_date), "yyyy-MM-dd")
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(booking)
    })
    return grouped
  }, [bookings])

  // Calculate capacity info per day
  const dayCapacityInfo = useMemo(() => {
    const info: Record<string, DayCapacityInfo> = {}

    Object.entries(bookingsByDate).forEach(([date, dayBookings]) => {
      const totalBoxes = dayBookings.reduce((sum, b) => sum + b.box_count, 0)
      const hasPendingApprovals = dayBookings.some(b => b.is_pending_approval)
      const capacityPercent = dailyCapacity?.daily_limit_boxes
        ? (totalBoxes / dailyCapacity.daily_limit_boxes) * 100
        : 0

      info[date] = {
        totalBoxes,
        capacityPercent,
        hasPendingApprovals,
      }
    })

    return info
  }, [bookingsByDate, dailyCapacity])

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const totalBookings = bookings.length
    const totalBoxes = bookings.reduce((sum, b) => sum + b.box_count, 0)
    const totalTons = bookings.reduce((sum, b) => sum + Number(b.weight_tons || 0), 0)

    // Find busiest day
    let busiestDay = ""
    let maxBookings = 0
    Object.entries(bookingsByDate).forEach(([date, dateBookings]) => {
      if (dateBookings.length > maxBookings) {
        maxBookings = dateBookings.length
        busiestDay = format(new Date(date), "MMM d")
      }
    })

    return { totalBookings, totalBoxes, totalTons, busiestDay, maxBookings }
  }, [bookings, bookingsByDate])

  // Get bookings for selected date with status filter
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dayBookings = bookingsByDate[dateKey] || []

    if (statusFilter === "all") return dayBookings

    // Handle special case for rejected status (includes approval rejection)
    if (statusFilter === "rejected") {
      return dayBookings.filter(b => b.status === "rejected" || b.approval_status === "rejected")
    }

    // Handle booked status (exclude approval-rejected)
    if (statusFilter === "booked") {
      return dayBookings.filter(b => b.status === "booked" && b.approval_status !== "rejected")
    }

    return dayBookings.filter(b => b.status === statusFilter)
  }, [selectedDate, bookingsByDate, statusFilter])

  // Get status counts for selected date
  const statusCounts = useMemo(() => {
    if (!selectedDate) return { all: 0, booked: 0, received: 0, exited: 0, rejected: 0 }

    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dayBookings = bookingsByDate[dateKey] || []

    return {
      all: dayBookings.length,
      // Booked includes pending and approved, but excludes approval-rejected
      booked: dayBookings.filter(b => b.status === "booked" && b.approval_status !== "rejected").length,
      received: dayBookings.filter(b => b.status === "received").length,
      exited: dayBookings.filter(b => b.status === "exited").length,
      // Rejected includes both gate rejection and approval rejection
      rejected: dayBookings.filter(b => b.status === "rejected" || b.approval_status === "rejected").length,
    }
  }, [selectedDate, bookingsByDate])

  // Custom day content with booking indicators
  const modifiers = useMemo(() => {
    const hasBookings: Date[] = []
    Object.keys(bookingsByDate).forEach((dateStr) => {
      hasBookings.push(new Date(dateStr))
    })
    return { hasBookings }
  }, [bookingsByDate])

  const modifiersStyles = {
    hasBookings: {
      fontWeight: "bold",
    },
  }

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return
    const dateKey = format(date, "yyyy-MM-dd")
    if (bookingsByDate[dateKey]) {
      setSelectedDate(date)
      setStatusFilter("all") // Reset filter when opening
      setSheetOpen(true)
    }
  }

  const handleJumpToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    // Optionally open today if it has bookings
    const todayKey = format(today, "yyyy-MM-dd")
    if (bookingsByDate[todayKey]) {
      setSelectedDate(today)
      setStatusFilter("all")
      setSheetOpen(true)
    }
  }

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
    fetchData(currentMonth)
  }

  const getDayBookingCount = (day: Date): number => {
    const dateKey = format(day, "yyyy-MM-dd")
    return bookingsByDate[dateKey]?.length || 0
  }

  const getBadgeColor = (capacityPercent: number, hasPendingApprovals: boolean): string => {
    if (hasPendingApprovals) {
      return "bg-amber-600 hover:bg-amber-600"
    }
    if (capacityPercent >= 100) {
      return "bg-red-600 hover:bg-red-600"
    }
    if (capacityPercent >= 80) {
      return "bg-orange-600 hover:bg-orange-600"
    }
    return "bg-emerald-600 hover:bg-emerald-600"
  }

  const getCapacityIndicator = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const info = dayCapacityInfo[dateKey]
    if (!info) return null

    return (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
        {info.hasPendingApprovals && (
          <div className="size-1 rounded-full bg-amber-600" />
        )}
        <div className={cn(
          "size-1 rounded-full",
          info.capacityPercent >= 100 ? "bg-red-600" :
          info.capacityPercent >= 80 ? "bg-orange-600" : "bg-emerald-600"
        )} />
      </div>
    )
  }

  // Loading skeleton
  if (loading || statsLoading) {
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{tStats('pageTitle')}</h2>
            <p className="text-muted-foreground mt-1">{tStats('pageSubtitle')}</p>
          </div>
        </div>

        {/* Date Filter Skeleton */}
        <div className="rounded-xl border bg-card p-4 mb-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Daily List Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{tStats('pageTitle')}</h2>
          <p className="text-muted-foreground mt-1">{tStats('pageSubtitle')}</p>
        </div>
      </div>

      {/* Range Stats Section */}
      <div className="space-y-4">
        {/* Date Filter */}
        <StatsDateFilter
          dateFrom={statsDateFrom}
          dateTo={statsDateTo}
          onDateChange={handleStatsDateChange}
        />

        {/* Capacity KPIs */}
        <CapacityStatsCards stats={rangeStats} isLoading={statsLoading} />

        {/* Performance KPIs */}
        <PerformanceStatsCards stats={rangeStats} isLoading={statsLoading} />

        {/* Daily Breakdown List */}
        {rangeStats?.daily_stats && rangeStats.daily_stats.length > 0 && (
          <DailyStatsList
            dailyStats={rangeStats.daily_stats}
            locale={locale}
            onDayClick={handleStatsDayClick}
          />
        )}
      </div>

      {/* Day Bookings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </SheetTitle>
            <SheetDescription>
              {tStats('bookingsOnDay', { count: statusCounts.all })}
            </SheetDescription>
          </SheetHeader>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="mt-4">
            <div ref={tabsScrollRef} className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
              <TabsList className={`inline-flex w-auto h-auto ${isRTL ? "flex-row-reverse" : ""}`}>
                <TabsTrigger value="all" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t('filters.all')}
                  {statusCounts.all > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="booked" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t('filters.booked')}
                  {statusCounts.booked > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.booked}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="received" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t('filters.received')}
                  {statusCounts.received > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.received}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="exited" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t('filters.exited')}
                  {statusCounts.exited > 0 && (
                    <Badge variant="secondary" className="ms-1 h-5 px-1.5 text-[10px]">
                      {statusCounts.exited}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-3 py-2 whitespace-nowrap">
                  {t('filters.rejected')}
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
                  ? tStats('noBookingsWithStatus', { status: statusFilter })
                  : tStats('noBookingsEmpty')
                }
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
