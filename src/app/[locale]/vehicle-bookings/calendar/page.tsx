"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Truck,
  AlertCircle
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking, DailyCapacity } from "@/types/vehicle-booking"
import { BookingCard } from "@/components/vehicle-booking/booking-card"
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog"
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog"
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog"
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog"
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog"
import { ApproveDialog } from "@/components/vehicle-booking/approve-dialog"
import { RejectApprovalDialog } from "@/components/vehicle-booking/reject-approval-dialog"
import { EditDialog } from "@/components/vehicle-booking/edit-dialog"
import { useRouter } from "@/i18n/navigation"
import { format, startOfMonth, endOfMonth, isToday, isSameMonth, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

interface DayCapacityInfo {
  totalBoxes: number
  capacityPercent: number
  hasPendingApprovals: boolean
}

export default function CalendarViewPage() {
  const t = useTranslations('vehicleBookings')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookings, setBookings] = useState<VehicleBooking[]>([])
  const [dailyCapacity, setDailyCapacity] = useState<DailyCapacity | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "booked" | "received" | "exited" | "rejected">("all")

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
    return dayBookings.filter(b => b.status === statusFilter)
  }, [selectedDate, bookingsByDate, statusFilter])

  // Get status counts for selected date
  const statusCounts = useMemo(() => {
    if (!selectedDate) return { all: 0, booked: 0, received: 0, exited: 0, rejected: 0 }

    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dayBookings = bookingsByDate[dateKey] || []

    return {
      all: dayBookings.length,
      booked: dayBookings.filter(b => b.status === "booked").length,
      received: dayBookings.filter(b => b.status === "received").length,
      exited: dayBookings.filter(b => b.status === "exited").length,
      rejected: dayBookings.filter(b => b.status === "rejected").length,
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
  if (loading) {
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('calendarView')}</h2>
            <p className="text-muted-foreground mt-1">{t('viewBookingSchedule')}</p>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="size-5 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Skeleton */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </>
    )
  }

  // Empty state
  const hasAnyBookings = bookings.length > 0

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
          <h2 className="text-3xl font-bold tracking-tight">{t('calendarView')}</h2>
          <p className="text-muted-foreground mt-1">{t('viewBookingSchedule')}</p>
        </div>
        {!isSameMonth(currentMonth, new Date()) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToToday}
            className="gap-2"
          >
            <CalendarCheck className="size-4" />
            <span className="hidden sm:inline">Today</span>
          </Button>
        )}
      </div>

      {/* Monthly Stats Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
        </div>

        {hasAnyBookings ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Total Bookings</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {monthlyStats.totalBookings}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Total Boxes</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {monthlyStats.totalBoxes}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Total Weight</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {monthlyStats.totalTons.toFixed(2)} tons
              </div>
            </div>
            {monthlyStats.busiestDay && (
              <div>
                <div className="text-muted-foreground text-xs">Busiest Day</div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {monthlyStats.busiestDay} ({monthlyStats.maxBookings})
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-muted-foreground text-sm">
              No bookings this month
            </div>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
        {hasAnyBookings ? (
          <>
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDayClick}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border-0"
              components={{
                DayContent: ({ date }) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  const count = getDayBookingCount(date)
                  const info = dayCapacityInfo[dateKey]

                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{format(date, "d")}</span>
                      {count > 0 && (
                        <>
                          <Badge
                            className={cn(
                              "absolute top-0 right-0 h-5 min-w-[1.25rem] px-1 text-[10px] pointer-events-none",
                              info ? getBadgeColor(info.capacityPercent, info.hasPendingApprovals) : "bg-blue-600 hover:bg-blue-600"
                            )}
                          >
                            {count}
                          </Badge>
                          {info && getCapacityIndicator(date)}
                        </>
                      )}
                    </div>
                  )
                },
              }}
            />

            {/* Legend */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">Legend:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-accent border border-border" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="h-5 min-w-[1.25rem] px-1 text-[10px] bg-emerald-600 hover:bg-emerald-600">2</Badge>
                  <span>Under capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="h-5 min-w-[1.25rem] px-1 text-[10px] bg-orange-600 hover:bg-orange-600">3</Badge>
                  <span>Near capacity (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="h-5 min-w-[1.25rem] px-1 text-[10px] bg-red-600 hover:bg-red-600">5</Badge>
                  <span>Over capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="h-5 min-w-[1.25rem] px-1 text-[10px] bg-amber-600 hover:bg-amber-600">1</Badge>
                  <span>Pending approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-600" />
                  <span>Capacity dot</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Truck className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Bookings This Month</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              There are no vehicle bookings for {format(currentMonth, "MMMM yyyy")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Go to Current Month
              </Button>
              <Button
                onClick={() => router.push("/vehicle-bookings/new")}
              >
                Create Booking
              </Button>
            </div>
          </div>
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
              {statusCounts.all} booking{statusCounts.all !== 1 ? 's' : ''} on this day
            </SheetDescription>
          </SheetHeader>

          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">
                All
                {statusCounts.all > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {statusCounts.all}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="booked" className="text-xs">
                Booked
                {statusCounts.booked > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {statusCounts.booked}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="text-xs">
                Received
                {statusCounts.received > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {statusCounts.received}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="exited" className="text-xs">
                Exited
                {statusCounts.exited > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {statusCounts.exited}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                Rejected
                {statusCounts.rejected > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {statusCounts.rejected}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
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
                No {statusFilter !== "all" ? statusFilter : ""} bookings
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
