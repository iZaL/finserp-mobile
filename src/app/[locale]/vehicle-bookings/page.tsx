"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Search, Plus, RefreshCw, Package } from "lucide-react"
import type {
  VehicleBooking,
  BookingFilters,
  CompleteOffloadingRequest,
  Media,
} from "@/types/vehicle-booking"
import { toast } from "sonner"
import { BookingCard } from "@/components/vehicle-booking/booking-card"
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog"
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog"
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog"
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog"
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog"
import { ApproveDialog } from "@/components/vehicle-booking/approve-dialog"
import { RejectApprovalDialog } from "@/components/vehicle-booking/reject-approval-dialog"
import { StartOffloadingDialog } from "@/components/vehicle-booking/start-offloading-dialog"
import { CompleteOffloadingSheet } from "@/components/vehicle-booking/complete-offloading-sheet"
import { CapacityCard } from "@/components/vehicle-booking/capacity-card"
import { BookingDetailsDrawer } from "@/components/vehicle-booking/booking-details-drawer"
import { EditDrawer } from "@/components/vehicle-booking/edit-drawer"
import { FilePreviewModal } from "@/components/vehicle-booking/FilePreviewModal"
import { VehicleBookingGuard } from "@/components/permission-guard"
import { usePermissions } from "@/lib/stores/permission-store"
import { useDialogManager } from "@/hooks/use-dialog-manager"
import {
  useVehicleBookingDashboard,
  useBulkAction,
  useCompleteOffloading,
} from "@/hooks/use-vehicle-bookings"

export default function VehicleBookingsPage() {
  const router = useRouter()
  const t = useTranslations("vehicleBookings")
  const locale = useLocale()
  const isRTL = locale === "ar"
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const permissions = usePermissions()

  // Temporary flag to hide bulk selection features
  const ENABLE_BULK_SELECTION = false

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingFilters["status"]>("all")
  const [timeRangeFilter] = useState<BookingFilters["date_filter"]>("current")
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(new Set())

  // Consolidated dialog management
  const { openDialog, closeDialog, isOpen, selectedItem: selectedBooking } = useDialogManager<VehicleBooking>()
  const [previewAttachment, setPreviewAttachment] = useState<Media | null>(null)

  // React Query hooks - All data fetching is now cached and optimized
  const {
    bookings,
    capacity: capacityInfo,
    settings,
    isLoading: loading,
    refetch,
  } = useVehicleBookingDashboard({
    status: "all", // Always fetch all bookings
    date_filter: timeRangeFilter,
    per_page: 50,
  })

  // Mutations
  const bulkActionMutation = useBulkAction()
  const completeOffloadingMutation = useCompleteOffloading()

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth
    }
  }, [isRTL])

  const handleRefresh = async () => {
    await refetch()
    toast.success(t("refreshSuccess"))
  }

  // Action handlers
  const handleReceive = (booking: VehicleBooking) => {
    openDialog('receive', booking)
  }

  const handleReject = (booking: VehicleBooking) => {
    openDialog('reject', booking)
  }

  const handleExit = (booking: VehicleBooking) => {
    openDialog('exit', booking)
  }

  const handleUnreceive = (booking: VehicleBooking) => {
    openDialog('unreceive', booking)
  }

  const handleEdit = (booking: VehicleBooking) => {
    openDialog('edit', booking)
  }

  const handleDelete = (booking: VehicleBooking) => {
    openDialog('delete', booking)
  }

  const handleApprove = (booking: VehicleBooking) => {
    openDialog('approve', booking)
  }

  const handleRejectApproval = (booking: VehicleBooking) => {
    openDialog('rejectApproval', booking)
  }

  const handleStartOffloading = (booking: VehicleBooking) => {
    openDialog('startOffloading', booking)
  }

  const handleCompleteOffloading = (booking: VehicleBooking) => {
    openDialog('completeOffloading', booking)
  }

  const handleCompleteOffloadingSubmit = (
    booking: VehicleBooking,
    data: CompleteOffloadingRequest
  ) => {
    completeOffloadingMutation.mutate({
      id: booking.id,
      data,
    }, {
      onSuccess: () => {
        // Close dialog after mutation AND cache updates complete
        closeDialog()
      }
    })
  }

  const handleViewDetails = (booking: VehicleBooking) => {
    openDialog('details', booking)
  }

  const handleDialogSuccess = () => {
    // React Query will automatically refetch after mutations
    // No manual refetch needed - data stays in sync automatically
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBookingUpdate = (_updatedBooking: VehicleBooking) => {
    // Note: React Query cache is automatically updated by mutation hooks
    // No need to manually update state - the selectedItem will reflect the latest cached data
  }

  const handleSelectionChange = (booking: VehicleBooking, selected: boolean) => {
    const newSelection = new Set(selectedBookings)
    if (selected) {
      newSelection.add(booking.id)
    } else {
      newSelection.delete(booking.id)
    }
    setSelectedBookings(newSelection)
  }

  const handleBulkReceive = () => {
    const count = selectedBookings.size
    bulkActionMutation.mutate({
      vehicle_ids: Array.from(selectedBookings),
      action: "receive",
    }, {
      onSuccess: () => {
        toast.success(`Successfully received ${count} vehicle(s)`)
        setSelectedBookings(new Set())
      }
    })
  }

  const handleBulkReject = () => {
    const count = selectedBookings.size
    bulkActionMutation.mutate({
      vehicle_ids: Array.from(selectedBookings),
      action: "reject",
    }, {
      onSuccess: () => {
        toast.success(`Successfully rejected ${count} vehicle(s)`)
        setSelectedBookings(new Set())
      }
    })
  }

  const handleBulkExit = () => {
    const count = selectedBookings.size
    bulkActionMutation.mutate({
      vehicle_ids: Array.from(selectedBookings),
      action: "exit",
    }, {
      onSuccess: () => {
        toast.success(`Successfully exited ${count} vehicle(s)`)
        setSelectedBookings(new Set())
      }
    })
  }

  // Memoized filtered bookings for performance
  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        // Apply status filter - make categories mutually exclusive
        if (statusFilter !== "all") {
          if (statusFilter === "pending") {
            if (!booking.is_pending_approval) return false
          } else if (statusFilter === "booked") {
            if (
              booking.status !== "booked" ||
              booking.is_pending_approval ||
              booking.approval_status === "rejected"
            )
              return false
          } else if (statusFilter === "rejected") {
            if (booking.status !== "rejected" && booking.approval_status !== "rejected")
              return false
          } else if (statusFilter === "exited") {
            // Show both offloaded and exited vehicles in the exited tab
            if (booking.status !== "exited" && booking.status !== "offloaded") return false
          } else {
            // For received and other statuses, just check status
            if (booking.status !== statusFilter) return false
          }
        }

        // Exclude received/offloading vehicles (they're shown in "Currently Offloading" section)
        // But allow offloaded vehicles when exited filter is active
        if (statusFilter === "exited") {
          // When exited filter is active, only exclude received and offloading
          if (booking.status === "received" || booking.status === "offloading") return false
        } else {
          // For other filters, exclude received/offloading/offloaded (they're shown in "Currently Offloading" section)
          if (
            booking.status === "received" ||
            booking.status === "offloading" ||
            booking.status === "offloaded"
          )
            return false
        }

        // Apply search filter (if search query is empty, show all)
        if (!searchQuery.trim()) {
          return true
        }

        return (
          booking.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (booking.driver_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (booking.driver_phone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (booking.supplier_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (booking.supplier_phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        )
      }),
    [bookings, statusFilter, searchQuery]
  )

  // Memoized vehicles inside factory for performance
  const vehiclesInsideFactory = useMemo(
    () =>
      bookings.filter((b) => {
        // Status filter
        if (b.status !== "received" && b.status !== "offloading" && b.status !== "offloaded")
          return false

        // Apply search filter
        if (!searchQuery.trim()) return true

        return (
          b.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.driver_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (b.driver_phone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (b.supplier_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (b.supplier_phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        )
      }),
    [bookings, searchQuery]
  )

  // Memoized status counts for performance
  const statusCounts = useMemo(
    () => ({
      // Bookings waiting for approval
      pending: bookings.filter((b) => b.is_pending_approval).length,

      // Bookings that are approved and waiting to be received (exclude pending and approval-rejected)
      booked: bookings.filter(
        (b) =>
          b.status === "booked" && !b.is_pending_approval && b.approval_status !== "rejected"
      ).length,

      // Bookings currently in factory being offloaded (received + offloading + offloaded)
      received: bookings.filter(
        (b) => b.status === "received" || b.status === "offloading" || b.status === "offloaded"
      ).length,

      // Bookings that finished offloading and exited (or offloaded but not exited yet)
      exited: bookings.filter((b) => b.status === "exited" || b.status === "offloaded").length,

      // Bookings rejected at gate OR rejected at approval stage
      rejected: bookings.filter(
        (b) => b.status === "rejected" || b.approval_status === "rejected"
      ).length,
    }),
    [bookings]
  )

  return (
    <VehicleBookingGuard>
      <div className="overscroll-none overflow-x-hidden flex flex-col gap-2">
        {/* Search Bar and Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={handleRefresh}
              disabled={bulkActionMutation.isPending}
              variant="outline"
              size="default"
              className="w-10 h-10"
            >
              <RefreshCw
                className={`size-5 ${bulkActionMutation.isPending ? "animate-spin" : ""}`}
              />
            </Button>
            {permissions.canCreateVehicleBooking() && settings?.vehicle_booking_enabled && (
              <Button
                onClick={() => router.push("/vehicle-bookings/new")}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 h-10 w-10 px-0 md:w-auto md:px-3"
                size="default"
                title={t("newBooking")}
              >
                <Plus className="size-5 md:mr-2" />
                <span className="hidden md:inline">{t("newBooking")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <Tabs
          value={statusFilter || "all"}
          onValueChange={(value: string) => setStatusFilter(value as BookingFilters["status"])}
        >
          <div ref={tabsScrollRef} className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <TabsList className={`inline-flex w-auto h-auto ${isRTL ? "flex-row-reverse" : ""}`}>
              <TabsTrigger value="all" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.all")} {bookings.length > 0 && `(${bookings.length})`}
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.pending")} {statusCounts.pending > 0 && `(${statusCounts.pending})`}
              </TabsTrigger>
              <TabsTrigger value="booked" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.booked")} {statusCounts.booked > 0 && `(${statusCounts.booked})`}
              </TabsTrigger>
              <TabsTrigger value="received" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.received")} {statusCounts.received > 0 && `(${statusCounts.received})`}
              </TabsTrigger>
              <TabsTrigger value="exited" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.exited")} {statusCounts.exited > 0 && `(${statusCounts.exited})`}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs px-3 py-2 whitespace-nowrap">
                {t("filters.rejected")} {statusCounts.rejected > 0 && `(${statusCounts.rejected})`}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Bulk Selection and Actions */}
        {ENABLE_BULK_SELECTION && (
          <div className="space-y-3">
            {/* Selection Count and Clear */}
            {selectedBookings.size > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("vehiclesSelected", { count: selectedBookings.size })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBookings(new Set())}
                >
                  {t("clearSelection")}
                </Button>
              </div>
            )}

            {/* Selection Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const booked = filteredBookings.filter((b) => b.status === "booked")
                  setSelectedBookings(new Set(booked.map((b) => b.id)))
                }}
              >
                {t("selectAllBooked", {
                  count: filteredBookings.filter((b) => b.status === "booked").length,
                })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const received = filteredBookings.filter((b) => b.status === "received")
                  setSelectedBookings(new Set(received.map((b) => b.id)))
                }}
              >
                {t("selectAllReceived", {
                  count: filteredBookings.filter((b) => b.status === "received").length,
                })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBookings(new Set(filteredBookings.map((b) => b.id)))
                }}
              >
                {t("selectAllVisible", { count: filteredBookings.length })}
              </Button>
            </div>

            {/* Bulk Action Buttons */}
            {selectedBookings.size > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkReceive}
                  disabled={bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? (
                    <>
                      <RefreshCw className="size-3 mr-1 animate-spin" />
                      {t("bulkReceiving")}
                    </>
                  ) : (
                    t("bulkReceive", { count: selectedBookings.size })
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? (
                    <>
                      <RefreshCw className="size-3 mr-1 animate-spin" />
                      {t("bulkRejecting")}
                    </>
                  ) : (
                    t("bulkReject", { count: selectedBookings.size })
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBulkExit}
                  disabled={bulkActionMutation.isPending}
                >
                  {bulkActionMutation.isPending ? (
                    <>
                      <RefreshCw className="size-3 mr-1 animate-spin" />
                      {t("bulkExiting")}
                    </>
                  ) : (
                    t("bulkExit", { count: selectedBookings.size })
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Capacity Card */}
        {statusFilter === "all" && !searchQuery.trim() && (
          <CapacityCard
            capacity={capacityInfo || null}
            loading={loading}
            allowOverride={settings?.allow_vehicle_booking_override}
          />
        )}

        {/* Vehicles Inside Factory Section */}
        {!loading &&
          (statusFilter === "all" ||
            statusFilter === "received" ||
            statusFilter === "offloading" ||
            statusFilter === "offloaded") &&
          vehiclesInsideFactory.length > 0 && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
                  {t("vehiclesInsideFactory")}
                </h3>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {vehiclesInsideFactory.length}{" "}
                  {vehiclesInsideFactory.length === 1 ? t("vehicle") : t("vehicles")}
                </span>
              </div>
              <div className="space-y-3">
                {vehiclesInsideFactory
                  .sort((a, b) => {
                    // Define priority: offloading (1) -> received (2) -> offloaded (3)
                    const statusPriority: Record<string, number> = {
                      offloading: 1, // Highest priority - actively being processed
                      received: 2, // Second priority - waiting to start
                      offloaded: 3, // Lowest priority - ready to exit
                    }

                    const priorityA = statusPriority[a.status] || 99
                    const priorityB = statusPriority[b.status] || 99

                    // First sort by status priority
                    if (priorityA !== priorityB) {
                      return priorityA - priorityB
                    }

                    // Within same status, sort by relevant timestamp
                    const getTimestamp = (booking: VehicleBooking) => {
                      if (booking.status === "offloading" && booking.offloading_started_at) {
                        return booking.offloading_started_at
                      }
                      if (booking.status === "offloaded" && booking.offloading_completed_at) {
                        return booking.offloading_completed_at
                      }
                      return booking.received_at || booking.created_at
                    }

                    const dateA = new Date(getTimestamp(a)).getTime()
                    const dateB = new Date(getTimestamp(b)).getTime()
                    return dateA - dateB // Oldest first (FIFO)
                  })
                  .map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onReceive={handleReceive}
                      onReject={handleReject}
                      onStartOffloading={handleStartOffloading}
                      onCompleteOffloading={handleCompleteOffloading}
                      onExit={handleExit}
                      onUnreceive={handleUnreceive}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onApprove={handleApprove}
                      onRejectApproval={handleRejectApproval}
                      onClick={handleViewDetails}
                      isSelected={selectedBookings.has(booking.id)}
                      onSelectionChange={
                        ENABLE_BULK_SELECTION ? handleSelectionChange : undefined
                      }
                    />
                  ))}
              </div>
            </div>
          )}

        {/* Bookings List */}
        <div className="space-y-3">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card text-card-foreground shadow-sm p-4"
                >
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
          ) : filteredBookings.length === 0 &&
            !(statusFilter === "received" && vehiclesInsideFactory.length > 0) ? (
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-sm p-12 text-center">
              <div className="rounded-full bg-slate-200/50 dark:bg-slate-700/50 size-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="size-8 text-slate-400 dark:text-slate-500" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noResultsFound")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noResultsDescription")}
                  </p>
                </>
              ) : statusFilter === "pending" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noPendingApprovals")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noPendingApprovalsDescription")}
                  </p>
                </>
              ) : statusFilter === "booked" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noBookedVehicles")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noBookedVehiclesDescription")}
                  </p>
                </>
              ) : statusFilter === "received" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noVehiclesInFactory")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noVehiclesInFactoryDescription")}
                  </p>
                </>
              ) : statusFilter === "exited" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noExitedVehicles")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noExitedVehiclesDescription")}
                  </p>
                </>
              ) : statusFilter === "rejected" ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noRejectedBookings")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noRejectedBookingsDescription")}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    {t("noBookingsFound")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t("noBookingsDescription")}
                  </p>
                  {permissions.canCreateVehicleBooking() && settings?.vehicle_booking_enabled && (
                    <Button
                      onClick={() => router.push("/vehicle-bookings/new")}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <Plus className="size-4 mr-2" />
                      {t("createBooking")}
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            filteredBookings
              .sort((a, b) => {
                // Define priority order for statuses (operational workflow)
                const statusPriority: Record<string, number> = {
                  booked: 1, // Highest priority - ready for reception (actionable)
                  pending: 2, // Second priority - awaiting approval (not actionable)
                  exited: 3, // Third priority - completed vehicles
                  rejected: 4, // Lowest priority - rejected vehicles
                }

                // Handle approval-rejected as rejected priority
                const getPriority = (booking: typeof a) => {
                  if (booking.approval_status === "rejected") {
                    return statusPriority["rejected"]
                  }
                  return statusPriority[booking.status] || 99
                }

                const priorityA = getPriority(a)
                const priorityB = getPriority(b)

                // First sort by status priority
                if (priorityA !== priorityB) {
                  return priorityA - priorityB
                }

                // Within same priority group, sort by state-specific date
                const getDateForStatus = (booking: typeof a) => {
                  if (booking.status === "exited" && booking.exited_at) {
                    return booking.exited_at
                  }
                  if (booking.status === "rejected" && booking.rejected_at) {
                    return booking.rejected_at
                  }
                  if (booking.approval_status === "rejected" && booking.approved_at) {
                    return booking.approved_at // Use approval date for approval-rejected
                  }
                  if (booking.status === "booked" && booking.approved_at) {
                    return booking.approved_at // Use approval date for booked
                  }
                  // Default to entry_datetime for pending and other cases
                  return booking.entry_datetime || booking.created_at
                }

                const dateA = new Date(getDateForStatus(a)).getTime()
                const dateB = new Date(getDateForStatus(b)).getTime()

                // For exited status, sort by most recent first (descending) - recent activity visible
                if (a.status === "exited" && b.status === "exited") {
                  return dateB - dateA
                }

                // For booked, pending, and rejected: sort oldest first (ascending) - FIFO
                return dateA - dateB
              })
              .map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onReceive={handleReceive}
                  onReject={handleReject}
                  onStartOffloading={handleStartOffloading}
                  onCompleteOffloading={handleCompleteOffloading}
                  onExit={handleExit}
                  onUnreceive={handleUnreceive}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onApprove={handleApprove}
                  onRejectApproval={handleRejectApproval}
                  onClick={handleViewDetails}
                  isSelected={selectedBookings.has(booking.id)}
                  onSelectionChange={ENABLE_BULK_SELECTION ? handleSelectionChange : undefined}
                />
              ))
          )}
        </div>

        {/* Dialogs */}
        <ReceiveDialog
          booking={selectedBooking}
          open={isOpen('receive')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <RejectDialog
          booking={selectedBooking}
          open={isOpen('reject')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <ExitDialog
          booking={selectedBooking}
          open={isOpen('exit')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <UnreceiveDialog
          booking={selectedBooking}
          open={isOpen('unreceive')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <DeleteDialog
          booking={selectedBooking}
          open={isOpen('delete')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <ApproveDialog
          booking={selectedBooking}
          open={isOpen('approve')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <RejectApprovalDialog
          booking={selectedBooking}
          open={isOpen('rejectApproval')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <StartOffloadingDialog
          booking={selectedBooking}
          open={isOpen('startOffloading')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <CompleteOffloadingSheet
          booking={selectedBooking}
          open={isOpen('completeOffloading')}
          onOpenChange={() => closeDialog()}
          onSubmit={handleCompleteOffloadingSubmit}
          loading={completeOffloadingMutation.isPending}
        />

        <BookingDetailsDrawer
          booking={selectedBooking}
          open={isOpen('details')}
          onOpenChange={() => closeDialog()}
          onExit={handleExit}
          onUnreceive={handleUnreceive}
          onReject={handleReject}
          onBookingUpdate={handleBookingUpdate}
          onPreviewAttachment={setPreviewAttachment}
        />

        <EditDrawer
          booking={selectedBooking}
          open={isOpen('edit')}
          onOpenChange={() => closeDialog()}
          onSuccess={handleDialogSuccess}
        />

        <FilePreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
        />
      </div>
    </VehicleBookingGuard>
  )
}
