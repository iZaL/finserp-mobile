'use client';

import {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations, useLocale} from 'next-intl';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Search, Plus, RefreshCw, Package} from 'lucide-react';
import type {
  VehicleBooking,
  BookingFilters,
  CompleteOffloadingRequest,
  Media,
} from '@/types/vehicle-booking';
import {toast} from 'sonner';
import {BookingCard} from '@/components/vehicle-booking/booking-card';
import {ReceiveDialog} from '@/components/vehicle-booking/receive-dialog';
import {RejectDialog} from '@/components/vehicle-booking/reject-dialog';
import {ExitDialog} from '@/components/vehicle-booking/exit-dialog';
import {UnreceiveDialog} from '@/components/vehicle-booking/unreceive-dialog';
import {DeleteDialog} from '@/components/vehicle-booking/delete-dialog';
import {ApproveDialog} from '@/components/vehicle-booking/approve-dialog';
import {RejectApprovalDialog} from '@/components/vehicle-booking/reject-approval-dialog';
import {StartOffloadingDialog} from '@/components/vehicle-booking/start-offloading-dialog';
import {CompleteOffloadingSheet} from '@/components/vehicle-booking/complete-offloading-sheet';
import {CapacityCard} from '@/components/vehicle-booking/capacity-card';
import {BookingDetailsDrawer} from '@/components/vehicle-booking/booking-details-drawer';
import {EditDrawer} from '@/components/vehicle-booking/edit-drawer';
import {FilePreviewModal} from '@/components/vehicle-booking/FilePreviewModal';
import {BookingEmptyState} from '@/components/vehicle-booking/booking-empty-state';
import {BookingListSkeleton} from '@/components/vehicle-booking/booking-list-skeleton';
import {VehicleBookingGuard} from '@/components/permission-guard';
import {usePermissions} from '@/lib/stores/permission-store';
import {useDialogManager} from '@/hooks/use-dialog-manager';
import {useVehicleBookingFilters} from '@/hooks/use-vehicle-booking-filters';
import {
  useVehicleBookingDashboard,
  useCompleteOffloading,
} from '@/hooks/use-vehicle-bookings';

export default function VehicleBookingsPage() {
  const router = useRouter();
  const t = useTranslations('vehicleBookings');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const permissions = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<BookingFilters['status']>('all');
  const [timeRangeFilter] = useState<BookingFilters['date_filter']>('current');
  const [previewAttachment, setPreviewAttachment] = useState<Media | null>(
    null
  );

  // Dialog management
  const {
    openDialog,
    closeDialog,
    isOpen,
    selectedItem: selectedBooking,
  } = useDialogManager<VehicleBooking>();

  // Data fetching
  const {
    bookings,
    capacity: capacityInfo,
    settings,
    isLoading: loading,
    refetch,
  } = useVehicleBookingDashboard({
    status: 'all',
    date_filter: timeRangeFilter,
    per_page: 50,
  });

  // Mutations
  const completeOffloadingMutation = useCompleteOffloading();

  // Filtering hook - memoized filtering, sorting, and counting
  const {filteredBookings, vehiclesInsideFactory, statusCounts} =
    useVehicleBookingFilters({
      bookings,
      statusFilter,
      searchQuery,
    });

  // Set initial scroll position for RTL
  useEffect(() => {
    if (isRTL && tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft = tabsScrollRef.current.scrollWidth;
    }
  }, [isRTL]);

  // Action handlers - consolidated using useMemo
  const bookingActions = useMemo(
    () => ({
      receive: (b: VehicleBooking) => openDialog('receive', b),
      reject: (b: VehicleBooking) => openDialog('reject', b),
      exit: (b: VehicleBooking) => openDialog('exit', b),
      unreceive: (b: VehicleBooking) => openDialog('unreceive', b),
      edit: (b: VehicleBooking) => openDialog('edit', b),
      delete: (b: VehicleBooking) => openDialog('delete', b),
      approve: (b: VehicleBooking) => openDialog('approve', b),
      rejectApproval: (b: VehicleBooking) => openDialog('rejectApproval', b),
      startOffloading: (b: VehicleBooking) => openDialog('startOffloading', b),
      completeOffloading: (b: VehicleBooking) =>
        openDialog('completeOffloading', b),
      viewDetails: (b: VehicleBooking) => openDialog('details', b),
    }),
    [openDialog]
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success(t('refreshSuccess'));
  }, [refetch, t]);

  const handleCompleteOffloadingSubmit = useCallback(
    (booking: VehicleBooking, data: CompleteOffloadingRequest) => {
      completeOffloadingMutation.mutate(
        {id: booking.id, data},
        {
          onSuccess: () => {
            closeDialog();
            setStatusFilter('exited');
          },
        }
      );
    },
    [completeOffloadingMutation, closeDialog]
  );

  const handleCreateBooking = useCallback(() => {
    router.push('/vehicle-bookings/new');
  }, [router]);

  // Check if user can create bookings
  const canCreateBooking =
    permissions.canCreateVehicleBooking() &&
    (settings?.vehicle_booking_enabled ?? false);

  // Tabs that show the factory section
  const isFactoryTab =
    statusFilter === 'all' ||
    statusFilter === 'received' ||
    statusFilter === 'offloading' ||
    statusFilter === 'offloaded';

  // Show factory section
  const showFactorySection =
    !loading && isFactoryTab && vehiclesInsideFactory.length > 0;

  // Show empty state
  // For factory tabs: empty when both lists are empty
  // For other tabs: empty when filtered list is empty
  const showEmptyState =
    !loading &&
    filteredBookings.length === 0 &&
    (isFactoryTab ? vehiclesInsideFactory.length === 0 : true);

  return (
    <VehicleBookingGuard>
      <div className="flex flex-col gap-2 overflow-x-hidden overscroll-none">
        {/* Search Bar and Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="default"
              className="h-10 w-10"
            >
              <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {canCreateBooking && (
              <Button
                onClick={handleCreateBooking}
                className="h-10 w-10 bg-blue-600 px-0 hover:bg-blue-700 md:w-auto md:px-3 dark:bg-blue-500 dark:hover:bg-blue-600"
                size="default"
                title={t('newBooking')}
              >
                <Plus className="size-5 md:mr-2" />
                <span className="hidden md:inline">{t('newBooking')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <Tabs
          value={statusFilter || 'all'}
          onValueChange={(value: string) =>
            setStatusFilter(value as BookingFilters['status'])
          }
        >
          <div
            ref={tabsScrollRef}
            className="scrollbar-hide -mx-4 overflow-x-auto px-4"
          >
            <TabsList
              className={`inline-flex h-auto w-auto ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <TabsTrigger
                value="all"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.all')}{' '}
                {bookings.length > 0 && `(${bookings.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.pending')}{' '}
                {statusCounts.pending > 0 && `(${statusCounts.pending})`}
              </TabsTrigger>
              <TabsTrigger
                value="booked"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.booked')}{' '}
                {statusCounts.booked > 0 && `(${statusCounts.booked})`}
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.received')}{' '}
                {statusCounts.received > 0 && `(${statusCounts.received})`}
              </TabsTrigger>
              <TabsTrigger
                value="exited"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.exited')}{' '}
                {statusCounts.exited > 0 && `(${statusCounts.exited})`}
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {t('filters.rejected')}{' '}
                {statusCounts.rejected > 0 && `(${statusCounts.rejected})`}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Capacity Card */}
        {statusFilter === 'all' && !searchQuery.trim() && (
          <CapacityCard
            capacity={capacityInfo || null}
            loading={loading}
            allowOverride={settings?.allow_vehicle_booking_override}
          />
        )}

        {/* Vehicles Inside Factory Section */}
        {showFactorySection && (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4 shadow-sm dark:border-emerald-900 dark:from-emerald-950/20 dark:to-green-950/20">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
                {t('vehiclesInsideFactory')}
              </h3>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {vehiclesInsideFactory.length}{' '}
                {vehiclesInsideFactory.length === 1
                  ? t('vehicle')
                  : t('vehicles')}
              </span>
            </div>
            <div className="space-y-3">
              {vehiclesInsideFactory.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onReceive={bookingActions.receive}
                  onReject={bookingActions.reject}
                  onStartOffloading={bookingActions.startOffloading}
                  onCompleteOffloading={bookingActions.completeOffloading}
                  onExit={bookingActions.exit}
                  onUnreceive={bookingActions.unreceive}
                  onEdit={bookingActions.edit}
                  onDelete={bookingActions.delete}
                  onApprove={bookingActions.approve}
                  onRejectApproval={bookingActions.rejectApproval}
                  onClick={bookingActions.viewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-3">
          {loading ? (
            <BookingListSkeleton />
          ) : showEmptyState ? (
            <BookingEmptyState
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              hasBookings={bookings.length > 0}
              canCreate={canCreateBooking}
              onCreateBooking={handleCreateBooking}
            />
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onReceive={bookingActions.receive}
                onReject={bookingActions.reject}
                onStartOffloading={bookingActions.startOffloading}
                onCompleteOffloading={bookingActions.completeOffloading}
                onExit={bookingActions.exit}
                onUnreceive={bookingActions.unreceive}
                onEdit={bookingActions.edit}
                onDelete={bookingActions.delete}
                onApprove={bookingActions.approve}
                onRejectApproval={bookingActions.rejectApproval}
                onClick={bookingActions.viewDetails}
              />
            ))
          )}
        </div>

        {/* Dialogs */}
        <ReceiveDialog
          booking={selectedBooking}
          open={isOpen('receive')}
          onOpenChange={() => closeDialog()}
        />

        <RejectDialog
          booking={selectedBooking}
          open={isOpen('reject')}
          onOpenChange={() => closeDialog()}
        />

        <ExitDialog
          booking={selectedBooking}
          open={isOpen('exit')}
          onOpenChange={() => closeDialog()}
        />

        <UnreceiveDialog
          booking={selectedBooking}
          open={isOpen('unreceive')}
          onOpenChange={() => closeDialog()}
        />

        <DeleteDialog
          booking={selectedBooking}
          open={isOpen('delete')}
          onOpenChange={() => closeDialog()}
        />

        <ApproveDialog
          booking={selectedBooking}
          open={isOpen('approve')}
          onOpenChange={() => closeDialog()}
        />

        <RejectApprovalDialog
          booking={selectedBooking}
          open={isOpen('rejectApproval')}
          onOpenChange={() => closeDialog()}
        />

        <StartOffloadingDialog
          booking={selectedBooking}
          open={isOpen('startOffloading')}
          onOpenChange={() => closeDialog()}
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
          onExit={bookingActions.exit}
          onUnreceive={bookingActions.unreceive}
          onReject={bookingActions.reject}
          onPreviewAttachment={setPreviewAttachment}
        />

        <EditDrawer
          booking={selectedBooking}
          open={isOpen('edit')}
          onOpenChange={() => closeDialog()}
        />

        <FilePreviewModal
          isOpen={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment}
        />
      </div>
    </VehicleBookingGuard>
  );
}
