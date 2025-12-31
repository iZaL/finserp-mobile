'use client';

import {useState, useEffect, useRef} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {ArrowLeft, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {VehicleBooking} from '@/types/vehicle-booking';
import {BookingCard} from '@/components/vehicle-booking/booking-card';
import {StatsDateFilter} from '@/components/vehicle-booking/stats-date-filter';
import {KeyMetricsCards} from '@/components/vehicle-booking/key-metrics-cards';
import {CapacityStatsCards} from '@/components/vehicle-booking/capacity-stats-cards';
import {PerformanceStatsCards} from '@/components/vehicle-booking/performance-stats-cards';
import {AdvancedStatsCards} from '@/components/vehicle-booking/advanced-stats-cards';
import {PdfReportGenerator} from '@/components/vehicle-booking/pdf-report-generator';
import {DailyStatsList} from '@/components/vehicle-booking/daily-stats-list';
import {ReceiveDialog} from '@/components/vehicle-booking/receive-dialog';
import {RejectDialog} from '@/components/vehicle-booking/reject-dialog';
import {ExitDialog} from '@/components/vehicle-booking/exit-dialog';
import {UnreceiveDialog} from '@/components/vehicle-booking/unreceive-dialog';
import {DeleteDialog} from '@/components/vehicle-booking/delete-dialog';
import {ApproveDialog} from '@/components/vehicle-booking/approve-dialog';
import {RejectApprovalDialog} from '@/components/vehicle-booking/reject-approval-dialog';
import {EditDialog} from '@/components/vehicle-booking/edit-dialog';
import {useRouter} from '@/i18n/navigation';
import {VehicleBookingReportsGuard} from '@/components/permission-guard';
import {format} from 'date-fns';
import {useVehicleBookings, useRangeStats} from '@/hooks/use-vehicle-bookings';
import {toast} from 'sonner';

export default function CalendarViewPage() {
  const t = useTranslations('vehicleBookings');
  const tStats = useTranslations('vehicleBookings.rangeStats');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'booked' | 'received' | 'exited' | 'rejected'
  >('all');

  // Stats state - Default to 8:00 AM today to 8:00 AM next day (24-hour period)
  const [statsDatetimeFrom, setStatsDatetimeFrom] = useState(() => {
    const today = new Date();
    return format(today, "yyyy-MM-dd'T'08:00");
  });
  const [statsDatetimeTo, setStatsDatetimeTo] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, "yyyy-MM-dd'T'08:00");
  });

  // Dialog states
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [unreceiveDialogOpen, setUnreceiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectApprovalDialogOpen, setRejectApprovalDialogOpen] =
    useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VehicleBooking | null>(
    null
  );

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
  });

  // Convert stats datetime to backend format and fetch
  const statsFrom = statsDatetimeFrom.replace('T', ' ') + ':00';
  const statsTo = statsDatetimeTo.replace('T', ' ') + ':59';
  const {
    data: rangeStats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useRangeStats(statsFrom, statsTo, true);

  const loading = bookingsLoading;
  const isRefreshing = isFetchingBookings || isFetchingStats;

  const handleStatsDatetimeChange = (from: string, to: string) => {
    setStatsDatetimeFrom(from);
    setStatsDatetimeTo(to);
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchBookings(), refetchStats()]);
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    }
  };

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth;
    }
  }, [isRTL, sheetOpen]);

  // Placeholder empty data - calendar functionality not implemented
  const selectedDateBookings: VehicleBooking[] = [];
  const statusCounts = {all: 0, booked: 0, received: 0, exited: 0, rejected: 0};

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

  const handleDialogSuccess = () => {
    // React Query will automatically refetch after mutations
    // No manual refetch needed - data stays in sync automatically
  };

  const handleStatsDayClick = () => {
    // Open the sheet to show bookings for the selected date
    setSheetOpen(true);
  };

  // Loading skeleton
  if (loading || statsLoading) {
    return (
      <>
        <div className="mb-3 flex items-center gap-2.5">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {tStats('pageTitle')}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {tStats('pageSubtitle')}
            </p>
          </div>
        </div>

        {/* Date Filter Skeleton */}
        <div className="bg-card mb-3 rounded-xl border p-3">
          <div className="bg-muted h-16 animate-pulse rounded" />
        </div>

        {/* Key Metrics Skeleton */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted h-28 animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Other Stats Skeleton */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
          ))}
        </div>

        {/* Daily List Skeleton */}
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  return (
    <VehicleBookingReportsGuard>
      <div className="mb-3 flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {tStats('pageTitle')}
          </h2>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {tStats('pageSubtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
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
            to: statsDatetimeTo.split('T')[0],
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
      </div>

      {/* Day Bookings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>{/* Calendar view not implemented */}</SheetTitle>
            <SheetDescription>
              {tStats('bookingsOnDay', {count: statusCounts.all})}
            </SheetDescription>
          </SheetHeader>

          {/* Status Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            className="mt-4"
          >
            <div
              ref={tabsScrollRef}
              className="scrollbar-hide -mx-6 overflow-x-auto px-6"
            >
              <TabsList
                className={`inline-flex h-auto w-auto ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <TabsTrigger
                  value="all"
                  className="px-3 py-2 text-xs whitespace-nowrap"
                >
                  {t('filters.all')}
                  {statusCounts.all > 0 && (
                    <Badge
                      variant="secondary"
                      className="ms-1 h-5 px-1.5 text-[10px]"
                    >
                      {statusCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="booked"
                  className="px-3 py-2 text-xs whitespace-nowrap"
                >
                  {t('filters.booked')}
                  {statusCounts.booked > 0 && (
                    <Badge
                      variant="secondary"
                      className="ms-1 h-5 px-1.5 text-[10px]"
                    >
                      {statusCounts.booked}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="received"
                  className="px-3 py-2 text-xs whitespace-nowrap"
                >
                  {t('filters.received')}
                  {statusCounts.received > 0 && (
                    <Badge
                      variant="secondary"
                      className="ms-1 h-5 px-1.5 text-[10px]"
                    >
                      {statusCounts.received}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="exited"
                  className="px-3 py-2 text-xs whitespace-nowrap"
                >
                  {t('filters.exited')}
                  {statusCounts.exited > 0 && (
                    <Badge
                      variant="secondary"
                      className="ms-1 h-5 px-1.5 text-[10px]"
                    >
                      {statusCounts.exited}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="px-3 py-2 text-xs whitespace-nowrap"
                >
                  {t('filters.rejected')}
                  {statusCounts.rejected > 0 && (
                    <Badge
                      variant="secondary"
                      className="ms-1 h-5 px-1.5 text-[10px]"
                    >
                      {statusCounts.rejected}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="mt-4 max-h-[calc(85vh-200px)] space-y-3 overflow-y-auto">
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
              <div className="text-muted-foreground py-8 text-center text-sm">
                {statusFilter !== 'all'
                  ? tStats('noBookingsWithStatus', {status: statusFilter})
                  : tStats('noBookingsEmpty')}
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
    </VehicleBookingReportsGuard>
  );
}
