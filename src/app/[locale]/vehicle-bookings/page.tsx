"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Truck, Search, Filter, Plus, RefreshCw, Package } from "lucide-react"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking, BookingStats, BookingFilters, DailyCapacity } from "@/types/vehicle-booking"
import { toast } from "sonner"
import { BookingCard } from "@/components/vehicle-booking/booking-card"
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog"
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog"
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog"
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog"
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog"
import { CapacityCard } from "@/components/vehicle-booking/capacity-card"

export default function VehicleBookingsPage() {
  const router = useRouter()
  const t = useTranslations('vehicleBookings')
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingFilters["status"]>("all")
  const [bookings, setBookings] = useState<VehicleBooking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [capacityInfo, setCapacityInfo] = useState<DailyCapacity | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Dialog states
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [unreceiveDialogOpen, setUnreceiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<VehicleBooking | null>(null)

  // Fetch bookings and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [bookingsData, statsData, capacityData] = await Promise.all([
        vehicleBookingService.getBookings({
          status: statusFilter,
          per_page: 50
        }),
        vehicleBookingService.getStats(),
        vehicleBookingService.getDailyCapacity(),
      ])
      setBookings(bookingsData.data)
      setStats(statsData)
      setCapacityInfo(capacityData)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchData()
      toast.success(t('refreshSuccess'))
    } catch (error) {
      console.error("Error refreshing:", error)
    } finally {
      setRefreshing(false)
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
    // Navigate to edit page (to be implemented)
    router.push(`/vehicle-bookings/${booking.id}/edit`)
  }

  const handleDelete = (booking: VehicleBooking) => {
    setSelectedBooking(booking)
    setDeleteDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    fetchData()
  }

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.driver_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (booking.supplier_name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="icon"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => router.push("/vehicle-bookings/new")}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Plus className="size-4 mr-2" />
            {t('newBooking')}
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Capacity Card */}
      <CapacityCard capacity={capacityInfo} loading={loading} />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2">
        {loading ? (
          <>
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div
              className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("booked")}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="size-4" />
                <span className="text-xs font-medium">{t('stats.booked')}</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.booked_vehicles || 0}
              </p>
            </div>

            <div
              className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("received")}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="size-4" />
                <span className="text-xs font-medium">{t('stats.received')}</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.received_vehicles || 0}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-12 text-center">
            <Truck className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('noBookingsFound')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('noBookingsDescription')}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push("/vehicle-bookings/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="size-4 mr-2" />
                {t('createBooking')}
              </Button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReceive={handleReceive}
              onReject={handleReject}
              onExit={handleExit}
              onUnreceive={handleUnreceive}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={(booking) => router.push(`/vehicle-bookings/${booking.id}`)}
            />
          ))
        )}
      </div>

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
    </>
  )
}
