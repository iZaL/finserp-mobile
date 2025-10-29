"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
Truck,
  Search,
  Plus,
  RefreshCw,
  Package,
} from "lucide-react";
import { vehicleBookingService } from "@/lib/services/vehicle-booking";
import axios from "axios";
import type {
  VehicleBooking,
  BookingFilters,
  DailyCapacity,
  VehicleBookingSettings,
  CompleteOffloadingRequest,
  Media,
} from "@/types/vehicle-booking";
import { toast } from "sonner";
import { BookingCard } from "@/components/vehicle-booking/booking-card";
import { ReceiveDialog } from "@/components/vehicle-booking/receive-dialog";
import { RejectDialog } from "@/components/vehicle-booking/reject-dialog";
import { ExitDialog } from "@/components/vehicle-booking/exit-dialog";
import { UnreceiveDialog } from "@/components/vehicle-booking/unreceive-dialog";
import { DeleteDialog } from "@/components/vehicle-booking/delete-dialog";
import { ApproveDialog } from "@/components/vehicle-booking/approve-dialog";
import { RejectApprovalDialog } from "@/components/vehicle-booking/reject-approval-dialog";
import { StartOffloadingDialog } from "@/components/vehicle-booking/start-offloading-dialog";
import { CompleteOffloadingSheet } from "@/components/vehicle-booking/complete-offloading-sheet";
import { CapacityCard } from "@/components/vehicle-booking/capacity-card";
import { BookingDetailsDrawer } from "@/components/vehicle-booking/booking-details-drawer";
import { EditDrawer } from "@/components/vehicle-booking/edit-drawer";
import { FilePreviewModal } from "@/components/vehicle-booking/FilePreviewModal";
import { VehicleBookingGuard } from "@/components/permission-guard";
import { usePermissions } from "@/lib/stores/permission-store";

export default function VehicleBookingsPage() {
  const router = useRouter();
  const t = useTranslations("vehicleBookings");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const permissions = usePermissions();

  // Temporary flag to hide bulk selection features
  const ENABLE_BULK_SELECTION = false;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<BookingFilters["status"]>("all");
  const [timeRangeFilter] =
    useState<BookingFilters["date_filter"]>("current");
  const [selectedBookings, setSelectedBookings] = useState<Set<number>>(new Set());
  const [bookings, setBookings] = useState<VehicleBooking[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<DailyCapacity | null>(null);
  const [settings, setSettings] = useState<VehicleBookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Dialog states
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [unreceiveDialogOpen, setUnreceiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectApprovalDialogOpen, setRejectApprovalDialogOpen] =
    useState(false);
  const [startOffloadingOpen, setStartOffloadingOpen] = useState(false);
  const [completeOffloadingOpen, setCompleteOffloadingOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VehicleBooking | null>(
    null
  );
  const [previewAttachment, setPreviewAttachment] = useState<Media | null>(null);

  // Fetch bookings and stats
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [bookingsData, statsData, dailyCapacityData, settingsData] =
        await Promise.all([
          vehicleBookingService.getBookings({
            status: "all", // Always fetch all bookings
            date_filter: timeRangeFilter,
            per_page: 50,
          }, { signal }),
          vehicleBookingService.getStats(undefined, { signal }),
          vehicleBookingService.getDailyCapacity(undefined, { signal }),
          vehicleBookingService.getSettings({ signal }),
        ]);
      setBookings(bookingsData.data);

      // Convert stats data to capacity format, using daily limits from daily capacity
      const capacityData = {
        date: dailyCapacityData.date,
        daily_limit_boxes: dailyCapacityData.daily_limit_boxes,
        daily_limit_tons: dailyCapacityData.daily_limit_tons,
        total_booked_boxes: statsData.total_boxes, // Use stats for actual factory load
        total_received_boxes: statsData.received_boxes,
        remaining_capacity_boxes: Math.max(0, dailyCapacityData.daily_limit_boxes - statsData.total_boxes),
        capacity_used_percent: dailyCapacityData.daily_limit_boxes > 0 ?
          (statsData.total_boxes / dailyCapacityData.daily_limit_boxes) * 100 : 0,
        can_override: dailyCapacityData.can_override
      };

      setCapacityInfo(capacityData);
      setSettings(settingsData);

    } catch (error: unknown) {
      if (!axios.isCancel(error)) {
        console.error("Error fetching bookings:", error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [timeRangeFilter]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchData]);

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth;
    }
  }, [isRTL]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
      toast.success(t("refreshSuccess"));
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Action handlers
  const handleReceive = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setReceiveDialogOpen(true);
  };

  const handleReject = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setRejectDialogOpen(true);
  };

  const handleExit = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setExitDialogOpen(true);
  };

  const handleUnreceive = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setUnreceiveDialogOpen(true);
  };

  const handleEdit = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleDelete = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  const handleApprove = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setApproveDialogOpen(true);
  };

  const handleRejectApproval = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setRejectApprovalDialogOpen(true);
  };

  const handleStartOffloading = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setStartOffloadingOpen(true);
  };

  const handleCompleteOffloading = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setCompleteOffloadingOpen(true);
  };


  const handleCompleteOffloadingSubmit = async (booking: VehicleBooking, data: CompleteOffloadingRequest) => {
    try {
      await vehicleBookingService.completeOffloading(booking.id, data);
      toast.success(t("completeOffloadingSuccess"));
      fetchData();
    } catch (error) {
      console.error("Complete offloading error:", error);
      toast.error(t("completeOffloadingError"));
    }
  };

  const handleViewDetails = (booking: VehicleBooking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchData();
  };

  const handleBookingUpdate = (updatedBooking: VehicleBooking) => {
    setSelectedBooking(updatedBooking);
    // Also update in the bookings list
    setBookings(prev =>
      prev.map(b => b.id === updatedBooking.id ? updatedBooking : b)
    );
  };

  const handleSelectionChange = (booking: VehicleBooking, selected: boolean) => {
    const newSelection = new Set(selectedBookings);
    if (selected) {
      newSelection.add(booking.id);
    } else {
      newSelection.delete(booking.id);
    }
    setSelectedBookings(newSelection);
  };

  const handleBulkReceive = async () => {
    try {
      setBulkLoading(true);
      await vehicleBookingService.bulkAction({
        vehicle_ids: Array.from(selectedBookings),
        action: "receive"
      });
      toast.success(`Successfully received ${selectedBookings.size} vehicle(s)`);
      setSelectedBookings(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk receive error:", error);
      toast.error("Failed to receive vehicles");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    try {
      setBulkLoading(true);
      await vehicleBookingService.bulkAction({
        vehicle_ids: Array.from(selectedBookings),
        action: "reject"
      });
      toast.success(`Successfully rejected ${selectedBookings.size} vehicle(s)`);
      setSelectedBookings(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk reject error:", error);
      toast.error("Failed to reject vehicles");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkExit = async () => {
    try {
      setBulkLoading(true);
      await vehicleBookingService.bulkAction({
        vehicle_ids: Array.from(selectedBookings),
        action: "exit"
      });
      toast.success(`Successfully exited ${selectedBookings.size} vehicle(s)`);
      setSelectedBookings(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk exit error:", error);
      toast.error("Failed to exit vehicles");
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) => {
      // Apply status filter - make categories mutually exclusive
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (!booking.is_pending_approval) return false;
        } else if (statusFilter === "booked") {
          if (booking.status !== "booked" || booking.is_pending_approval || booking.approval_status === "rejected") return false;
        } else if (statusFilter === "rejected") {
          if (booking.status !== "rejected" && booking.approval_status !== "rejected") return false;
        } else if (statusFilter === "exited") {
          // Show both offloaded and exited vehicles in the exited tab
          if (booking.status !== "exited" && booking.status !== "offloaded") return false;
        } else {
          // For received and other statuses, just check status
          if (booking.status !== statusFilter) return false;
        }
      }

      // Exclude received/offloading vehicles (they're shown in "Currently Offloading" section)
      // But allow offloaded vehicles when exited filter is active
      if (statusFilter === "exited") {
        // When exited filter is active, only exclude received and offloading
        if (booking.status === "received" || booking.status === "offloading") return false;
      } else {
        // For other filters, exclude received/offloading/offloaded (they're shown in "Currently Offloading" section)
        if (booking.status === "received" || booking.status === "offloading" || booking.status === "offloaded") return false;
      }

      // Apply search filter
      return (
        booking.vehicle_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (booking.driver_name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (booking.driver_phone?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (booking.supplier_name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (booking.supplier_phone?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
      );
    }
  );

  // Count vehicles by status - mutually exclusive categories
  const statusCounts = {
    // Bookings waiting for approval
    pending: bookings.filter((b) => b.is_pending_approval).length,

    // Bookings that are approved and waiting to be received (exclude pending and approval-rejected)
    booked: bookings.filter((b) =>
      b.status === "booked" &&
      !b.is_pending_approval &&
      b.approval_status !== "rejected"
    ).length,

    // Bookings currently in factory being offloaded (received + offloading + offloaded)
    received: bookings.filter((b) =>
      b.status === "received" ||
      b.status === "offloading" ||
      b.status === "offloaded"
    ).length,

    // Bookings that finished offloading and exited (or offloaded but not exited yet)
    exited: bookings.filter((b) => b.status === "exited" || b.status === "offloaded").length,

    // Bookings rejected at gate OR rejected at approval stage
    rejected: bookings.filter((b) =>
      b.status === "rejected" ||
      b.approval_status === "rejected"
    ).length,
  };

  return (
    <VehicleBookingGuard>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="default"
            className="w-11 h-11"
          >
            <RefreshCw
              className={`size-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          {permissions.canCreateVehicleBooking() && settings?.vehicle_booking_enabled && (
            <Button
              onClick={() => router.push("/vehicle-bookings/new")}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 w-11 h-11 px-0 md:w-auto md:px-3 md:h-10"
              size="default"
              title={t("newBooking")}
            >
              <Plus className="size-5 md:mr-2" />
              <span className="hidden md:inline">{t("newBooking")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Vehicle Booking System Status Indicator */}
      {settings && !settings.vehicle_booking_enabled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="flex-1">
              <div className="font-medium text-red-800 dark:text-red-200">
                Vehicle Booking System Disabled
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Vehicle booking is currently disabled. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>

      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter || "all"} onValueChange={(value: string) => setStatusFilter(value as BookingFilters["status"])}>
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
                {selectedBookings.size} vehicle(s) selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBookings(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Selection Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const booked = filteredBookings.filter(b => b.status === "booked");
                setSelectedBookings(new Set(booked.map(b => b.id)));
              }}
            >
              Select All Booked ({filteredBookings.filter(b => b.status === "booked").length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const received = filteredBookings.filter(b => b.status === "received");
                setSelectedBookings(new Set(received.map(b => b.id)));
              }}
            >
              Select All Received ({filteredBookings.filter(b => b.status === "received").length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
              }}
            >
              Select All Visible ({filteredBookings.length})
            </Button>
          </div>

          {/* Bulk Action Buttons */}
          {selectedBookings.size > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkReceive}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="size-3 mr-1 animate-spin" />
                    Receiving...
                  </>
                ) : (
                  `Bulk Receive (${selectedBookings.size})`
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkReject}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="size-3 mr-1 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  `Bulk Reject (${selectedBookings.size})`
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkExit}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="size-3 mr-1 animate-spin" />
                    Exiting...
                  </>
                ) : (
                  `Bulk Exit (${selectedBookings.size})`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Capacity Card */}
      {statusFilter === "all" && (
        <CapacityCard
          capacity={capacityInfo}
          loading={loading}
          allowOverride={settings?.allow_vehicle_booking_override}
          bookings={bookings}
          defaultBoxWeightKg={settings?.default_box_weight_kg}
        />
      )}

      {/* Vehicles Inside Factory Section */}
      {!loading && (statusFilter === "all" || statusFilter === "received" || statusFilter === "offloading" || statusFilter === "offloaded") && bookings.filter(b => b.status === "received" || b.status === "offloading" || b.status === "offloaded").length > 0 && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
              {t("vehiclesInsideFactory")}
            </h3>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {bookings.filter(b => b.status === "received" || b.status === "offloading" || b.status === "offloaded").length} {bookings.filter(b => b.status === "received" || b.status === "offloading" || b.status === "offloaded").length === 1 ? "vehicle" : "vehicles"}
            </span>
          </div>
          <div className="space-y-3">
            {bookings
              .filter(b => b.status === "received" || b.status === "offloading" || b.status === "offloaded")
              .sort((a, b) => {
                // Define priority: offloading (1) -> received (2) -> offloaded (3)
                const statusPriority: Record<string, number> = {
                  'offloading': 1,  // Highest priority - actively being processed
                  'received': 2,    // Second priority - waiting to start
                  'offloaded': 3    // Lowest priority - ready to exit
                };

                const priorityA = statusPriority[a.status] || 99;
                const priorityB = statusPriority[b.status] || 99;

                // First sort by status priority
                if (priorityA !== priorityB) {
                  return priorityA - priorityB;
                }

                // Within same status, sort by relevant timestamp
                const getTimestamp = (booking: VehicleBooking) => {
                  if (booking.status === "offloading" && booking.offloading_started_at) {
                    return booking.offloading_started_at;
                  }
                  if (booking.status === "offloaded" && booking.offloading_completed_at) {
                    return booking.offloading_completed_at;
                  }
                  return booking.received_at || booking.created_at;
                };

                const dateA = new Date(getTimestamp(a)).getTime();
                const dateB = new Date(getTimestamp(b)).getTime();
                return dateA - dateB; // Oldest first (FIFO)
              })
              .map(booking => (
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
        ) : filteredBookings.length === 0 && !(statusFilter === "received" && bookings.filter(b => b.status === "received").length > 0) ? (
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-sm p-12 text-center">
            <div className="rounded-full bg-slate-200/50 dark:bg-slate-700/50 size-16 mx-auto mb-4 flex items-center justify-center">
              <Truck className="size-8 text-slate-400 dark:text-slate-500" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No results found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filter to find what you&apos;re looking for
                </p>
              </>
            ) : statusFilter === "pending" ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No pending approvals
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  All bookings have been approved or there are no bookings awaiting approval
                </p>
              </>
            ) : statusFilter === "booked" ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No booked vehicles
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No vehicles are currently waiting to be received
                </p>
              </>
            ) : statusFilter === "received" ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No vehicles in factory
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No vehicles are currently being offloaded
                </p>
              </>
            ) : statusFilter === "exited" ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No exited vehicles
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No vehicles have completed offloading and exited yet
                </p>
              </>
            ) : statusFilter === "rejected" ? (
              <>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No rejected bookings
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No bookings have been rejected
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
                'booked': 1,     // Highest priority - ready for reception (actionable)
                'pending': 2,    // Second priority - awaiting approval (not actionable)
                'exited': 3,     // Third priority - completed vehicles
                'rejected': 4    // Lowest priority - rejected vehicles
              };

              // Handle approval-rejected as rejected priority
              const getPriority = (booking: typeof a) => {
                if (booking.approval_status === "rejected") {
                  return statusPriority['rejected'];
                }
                return statusPriority[booking.status] || 99;
              };

              const priorityA = getPriority(a);
              const priorityB = getPriority(b);

              // First sort by status priority
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }

              // Within same priority group, sort by state-specific date
              const getDateForStatus = (booking: typeof a) => {
                if (booking.status === "exited" && booking.exited_at) {
                  return booking.exited_at;
                }
                if (booking.status === "rejected" && booking.rejected_at) {
                  return booking.rejected_at;
                }
                if (booking.approval_status === "rejected" && booking.approved_at) {
                  return booking.approved_at; // Use approval date for approval-rejected
                }
                if (booking.status === "booked" && booking.approved_at) {
                  return booking.approved_at; // Use approval date for booked
                }
                // Default to entry_datetime for pending and other cases
                return booking.entry_datetime || booking.created_at;
              };

              const dateA = new Date(getDateForStatus(a)).getTime();
              const dateB = new Date(getDateForStatus(b)).getTime();

              // For exited status, sort by most recent first (descending) - recent activity visible
              if (a.status === "exited" && b.status === "exited") {
                return dateB - dateA;
              }

              // For booked, pending, and rejected: sort oldest first (ascending) - FIFO
              return dateA - dateB;
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

      <StartOffloadingDialog
        booking={selectedBooking}
        open={startOffloadingOpen}
        onOpenChange={setStartOffloadingOpen}
        onSuccess={handleDialogSuccess}
      />

      <CompleteOffloadingSheet
        booking={selectedBooking}
        open={completeOffloadingOpen}
        onOpenChange={setCompleteOffloadingOpen}
        onSubmit={handleCompleteOffloadingSubmit}
        loading={false}
      />

      <BookingDetailsDrawer
        booking={selectedBooking}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onExit={handleExit}
        onUnreceive={handleUnreceive}
        onReject={handleReject}
        onBookingUpdate={handleBookingUpdate}
        onPreviewAttachment={setPreviewAttachment}
      />

      <EditDrawer
        booking={selectedBooking}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <FilePreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </VehicleBookingGuard>
  );
}
