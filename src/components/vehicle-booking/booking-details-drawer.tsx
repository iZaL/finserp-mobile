'use client';

import {useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';
import {
  Truck,
  User,
  Users,
  Package,
  Weight,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  FileText,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash,
  LogIn,
  Paperclip,
  Shield,
  Fish,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {RelativeTime} from '@/components/relative-time';
import type {
  VehicleBooking,
  VehicleActivity,
  Media,
} from '@/types/vehicle-booking';
import {vehicleBookingService} from '@/lib/services/vehicle-booking';
import {CompactBillAttachments} from './compact-bill-attachments';
import {usePermissions} from '@/lib/stores/permission-store';
import {MoreVertical, RotateCcw} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface BookingDetailsDrawerProps {
  booking: VehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExit?: (booking: VehicleBooking) => void;
  onUnreceive?: (booking: VehicleBooking) => void;
  onReject?: (booking: VehicleBooking) => void;
  onBookingUpdate?: (booking: VehicleBooking) => void;
  onPreviewAttachment?: (attachment: Media | null) => void;
}

export function BookingDetailsDrawer({
  booking,
  open,
  onOpenChange,
  onExit,
  onUnreceive,
  onReject,
  onBookingUpdate,
  onPreviewAttachment,
}: BookingDetailsDrawerProps) {
  const t = useTranslations('vehicleBookings.bookingCard');
  const tDetails = useTranslations('vehicleBookings.bookingDetails');
  const permissions = usePermissions();
  const [activities, setActivities] = useState<VehicleActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Fetch activities when dialog opens and booking changes
  useEffect(() => {
    if (!open || !booking) {
      return;
    }

    const abortController = new AbortController();
    setIsLoadingActivities(true);

    vehicleBookingService
      .getBookingActivities(booking.id, {signal: abortController.signal})
      .then((data) => {
        setActivities(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch activities:', error);
          setActivities([]);
        }
      })
      .finally(() => {
        setIsLoadingActivities(false);
      });

    // Cleanup: abort the request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [open, booking]);

  // Reset states when drawer closes
  useEffect(() => {
    if (!open) {
      setShowActivities(false);
      setShowAttachments(false);
      setActivities([]);
      setIsLoadingActivities(false);
      onPreviewAttachment?.(null);
    }
  }, [open, onPreviewAttachment]);

  // Filter activities to show only edits (not status changes shown in Timeline)
  const editActivities = activities.filter(
    (activity) =>
      activity.action === 'updated' ||
      activity.action === 'edited' ||
      activity.action === 'approval_rejected'
  );

  // Helper function for timeline item styling
  const getTimelineColorClasses = (
    color: 'blue' | 'emerald' | 'red' | 'muted'
  ) => {
    const colorMap = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      emerald:
        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
      muted: 'bg-muted border',
    };
    return colorMap[color];
  };

  // Create dynamic timeline events array sorted chronologically
  const timelineEvents = booking
    ? [
        {
          type: 'booked',
          timestamp: booking.entry_datetime || booking.created_at,
          user: booking.created_by_name,
          icon: Clock,
          color: 'blue' as const,
        },
        ...(booking.approved_at
          ? [
              {
                type: 'approved',
                timestamp: booking.approved_at,
                user: booking.approved_by_name,
                icon: Shield,
                color: 'emerald' as const,
              },
            ]
          : []),
        ...(booking.received_at
          ? [
              {
                type: 'received',
                timestamp: booking.received_at,
                user: booking.received_by_name,
                icon: CheckCircle,
                color: 'emerald' as const,
              },
            ]
          : []),
        ...(booking.offloading_started_at
          ? [
              {
                type: 'offloading_started',
                timestamp: booking.offloading_started_at,
                user: booking.offloading_by_name,
                icon: Fish,
                color: 'blue' as const,
              },
            ]
          : []),
        ...(booking.offloading_completed_at
          ? [
              {
                type: 'offloading_completed',
                timestamp: booking.offloading_completed_at,
                user: booking.offloaded_by_name,
                icon: Fish,
                color: 'emerald' as const,
              },
            ]
          : []),
        ...(booking.exited_at
          ? [
              {
                type: 'exited',
                timestamp: booking.exited_at,
                user: booking.exited_by_name,
                icon: LogOut,
                color: 'muted' as const,
              },
            ]
          : []),
        ...(booking.rejected_at
          ? [
              {
                type: 'rejected',
                timestamp: booking.rejected_at,
                user: booking.rejected_by_name,
                icon: XCircle,
                color: 'red' as const,
              },
            ]
          : []),
      ].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  const handleUploadSuccess = (updatedVehicle: VehicleBooking) => {
    onBookingUpdate?.(updatedVehicle);
  };

  if (!booking) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'received':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'exited':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked':
        return Clock;
      case 'received':
        return CheckCircle;
      case 'exited':
        return LogOut;
      case 'rejected':
        return XCircle;
      default:
        return Info;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
      case 'booked':
        return LogIn;
      case 'received':
        return CheckCircle;
      case 'unreceived':
        return RotateCcw;
      case 'exited':
        return LogOut;
      case 'rejected':
        return XCircle;
      case 'updated':
      case 'edited':
        return Edit;
      case 'deleted':
        return Trash;
      case 'approved':
        return CheckCircle;
      case 'approval_rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
      case 'booked':
        return 'text-blue-600 dark:text-blue-400';
      case 'received':
      case 'approved':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'unreceived':
        return 'text-orange-600 dark:text-orange-400';
      case 'exited':
        return 'text-purple-600 dark:text-purple-400';
      case 'rejected':
      case 'approval_rejected':
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      case 'updated':
      case 'edited':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatChangeValue = (
    key: string,
    oldValue: string | number | boolean | null | undefined,
    newValue: string | number | boolean | null | undefined
  ): string | null => {
    // Skip system fields and relationships
    if (
      key.includes('_at') ||
      key.includes('_date') ||
      key.includes('_by') ||
      key === 'id' ||
      key === 'created_at' ||
      key === 'updated_at' ||
      key === 'creator' ||
      key === 'created_by'
    ) {
      return null;
    }

    if (key === 'box_count' || key === 'actual_box_count') {
      return `${oldValue} → ${newValue} boxes`;
    }
    if (key === 'vehicle_number') {
      return `${oldValue} → ${newValue}`;
    }
    if (key === 'weight_tons') {
      return `${oldValue} → ${newValue} tons`;
    }
    if (
      key === 'driver_name' ||
      key === 'driver_phone' ||
      key === 'supplier_name' ||
      key === 'supplier_phone'
    ) {
      return `${oldValue || 'N/A'} → ${newValue || 'N/A'}`;
    }
    if (key === 'status') {
      return `${oldValue} → ${newValue}`;
    }
    if (key === 'rejection_reason') {
      return newValue as string | null;
    }
    if (key === 'notes') {
      return 'Notes updated';
    }

    return `${oldValue ?? 'N/A'} → ${newValue ?? 'N/A'}`;
  };

  const StatusIcon = getStatusIcon(booking.status);

  const boxDiscrepancy = booking.actual_box_count
    ? booking.actual_box_count - booking.box_count
    : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100dvh] max-h-[100dvh] sm:h-[95vh] sm:max-h-[95vh]">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
          <DrawerHeader className="bg-background flex-shrink-0 border-b px-4 py-4 text-left">
            <DrawerTitle className="flex items-center justify-between gap-4">
              {/* Left: Icon + Primary Content */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="bg-muted/30 text-muted-foreground flex size-10 flex-shrink-0 items-center justify-center rounded-lg border">
                  <Truck className="size-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wider uppercase">
                    Vehicle Booking
                  </div>
                  <div className="text-foreground truncate text-xl font-bold">
                    {booking.vehicle_number}
                  </div>
                </div>
              </div>

              {/* Right: Status Badge */}
              <Badge
                className={`px-3 py-2 text-sm font-medium ${getStatusColor(
                  booking.status
                )} flex-shrink-0`}
              >
                <StatusIcon className="mr-2 size-4" />
                {t(booking.status)}
              </Badge>
            </DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3">
            {/* Added overflow-x-hidden */}
            <div className="space-y-2.5">
              {/* Creator Information - Compact */}
              {booking.created_by_name && (
                <div className="bg-muted/20 rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-background text-muted-foreground flex size-6 items-center justify-center rounded-full border">
                      <User className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {tDetails('createdBy')}:
                        </span>
                        <span className="truncate font-medium">
                          {booking.created_by_name}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <RelativeTime
                          date={booking.entry_datetime || booking.created_at}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              {/* Cargo Information */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Package className="size-4" />
                  {tDetails('cargoInformation')}
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      {tDetails('boxCount')}
                    </div>
                    <div className="text-xl font-bold">
                      {booking.actual_box_count &&
                      booking.actual_box_count !== booking.box_count ? (
                        <span className="flex items-center gap-1">
                          <span
                            className={
                              boxDiscrepancy < 0
                                ? 'text-red-600 dark:text-red-400'
                                : boxDiscrepancy > 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : ''
                            }
                          >
                            {booking.actual_box_count}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            /
                          </span>
                          <span className="text-muted-foreground text-lg">
                            {booking.box_count}
                          </span>
                        </span>
                      ) : (
                        booking.box_count
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {t('boxes')}
                      {booking.actual_box_count &&
                        booking.actual_box_count !== booking.box_count && (
                          <span
                            className={`ml-1 font-medium ${boxDiscrepancy < 0 ? 'text-red-600 dark:text-red-400' : boxDiscrepancy > 0 ? 'text-green-600 dark:text-green-400' : ''}`}
                          >
                            ({boxDiscrepancy > 0 ? '+' : ''}
                            {boxDiscrepancy})
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                    <div className="text-muted-foreground text-xs">
                      {tDetails('totalWeight')}
                    </div>
                    <div className="text-xl font-bold">
                      {Number(booking.weight_tons || 0).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {t('tons')}
                    </div>
                  </div>
                  {booking.box_weight_kg && (
                    <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                      <div className="text-muted-foreground text-xs">
                        {tDetails('boxWeight')}
                      </div>
                      <div className="flex items-center gap-1.5 text-base font-semibold">
                        <Weight className="text-muted-foreground size-4" />
                        {booking.box_weight_kg} kg
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Received Information */}
              {booking.status === 'received' && booking.actual_box_count && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle className="size-4 text-emerald-600" />
                      {tDetails('receivedInformation')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                        <div className="text-muted-foreground text-xs">
                          {tDetails('actualBoxCount')}
                        </div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {booking.actual_box_count}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {t('boxes')}
                        </div>
                      </div>
                      {boxDiscrepancy !== 0 && (
                        <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                          <div className="text-muted-foreground text-xs">
                            {tDetails('discrepancy')}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 text-xl font-bold ${
                              boxDiscrepancy > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {boxDiscrepancy > 0 ? (
                              <TrendingUp className="size-4" />
                            ) : (
                              <TrendingDown className="size-4" />
                            )}
                            {boxDiscrepancy > 0 ? '+' : ''}
                            {boxDiscrepancy}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {boxDiscrepancy > 0
                              ? tDetails('moreThanExpected')
                              : tDetails('lessThanExpected')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Rejection Information */}
              {booking.status === 'rejected' && booking.rejection_reason && (
                <>
                  <Separator className="my-2" />
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-900/10">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                      <AlertTriangle className="size-4" />
                      {tDetails('rejectionInformation')}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">
                          {t('rejectionReason')}
                        </div>
                        <div className="text-sm font-medium text-red-700 dark:text-red-400">
                          {booking.rejection_reason}
                        </div>
                      </div>
                      {booking.rejection_notes && (
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">
                            {tDetails('additionalNotes')}
                          </div>
                          <div className="text-sm">
                            {booking.rejection_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Approval Information */}
              {booking.is_pending_approval && (
                <>
                  <Separator className="my-2" />
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                      <Clock className="size-4" />
                      {tDetails('approvalInformation')}
                    </h3>
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      {t('waitingForApproval')}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-2">
                        <div className="text-muted-foreground mb-1 text-xs">
                          {tDetails('notes')}
                        </div>
                        <div className="text-sm">{booking.approval_notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Approval Rejected Information */}
              {booking.approval_status === 'rejected' && (
                <>
                  <Separator className="my-2" />
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-900/10">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                      <XCircle className="size-4" />
                      {tDetails('approvalRejectedTitle')}
                    </h3>
                    <div className="text-sm text-red-700 dark:text-red-400">
                      {t('approvalRejectedMessage')}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-2">
                        <div className="text-muted-foreground mb-1 text-xs">
                          {tDetails('notes')}
                        </div>
                        <div className="text-sm">{booking.approval_notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-2" />

              {/* Contact Information */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4" />
                  {tDetails('contactInformation')}
                </h3>
                <div className="grid gap-2">
                  {booking.driver_name && (
                    <div className="bg-muted/30 flex items-start gap-2.5 rounded-lg border p-3">
                      <User className="text-muted-foreground mt-0.5 size-4" />
                      <div className="flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">
                          {t('driver')}
                        </div>
                        <div className="text-sm font-medium">
                          {booking.driver_name}
                        </div>
                        {booking.driver_phone && (
                          <a
                            href={`tel:${booking.driver_phone}`}
                            className="mt-1 font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {booking.driver_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {booking.supplier_name && (
                    <div className="bg-muted/30 flex items-start gap-2.5 rounded-lg border p-3">
                      <Users className="text-muted-foreground mt-0.5 size-4" />
                      <div className="flex-1">
                        <div className="text-muted-foreground mb-1 text-xs">
                          {t('supplier')}
                        </div>
                        <div className="text-sm font-medium">
                          {booking.supplier_name}
                        </div>
                        {booking.supplier_phone && (
                          <a
                            href={`tel:${booking.supplier_phone}`}
                            className="mt-1 font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {booking.supplier_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-2" />

              {/* Timeline */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Clock className="size-4" />
                  {tDetails('timeline')}
                </h3>
                <div className="space-y-2.5">
                  {timelineEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    const isLast = index === timelineEvents.length - 1;

                    // Calculate duration to next event
                    let duration = '';
                    if (!isLast) {
                      const nextEvent = timelineEvents[index + 1];
                      const diffMs =
                        new Date(nextEvent.timestamp).getTime() -
                        new Date(event.timestamp).getTime();
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor(
                        (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                      );

                      if (hours > 0 && minutes > 0) {
                        duration = `${hours}h ${minutes}m`;
                      } else if (hours > 0) {
                        duration = `${hours}h`;
                      } else if (minutes > 0) {
                        duration = `${minutes}m`;
                      } else {
                        duration = '1m';
                      }
                    }

                    return (
                      <div
                        key={index}
                        className="relative flex items-start gap-2.5"
                      >
                        {/* Vertical line with duration */}
                        {!isLast && (
                          <>
                            <div className="bg-border absolute start-[13px] top-7 bottom-0 -mb-2.5 w-[2px]" />
                            {duration && (
                              <div className="text-muted-foreground bg-background border-border absolute start-[2px] top-[calc(50%+0.5rem)] rounded border px-1 py-0.5 text-[9px] font-medium whitespace-nowrap shadow-sm">
                                {duration}
                              </div>
                            )}
                          </>
                        )}
                        <div
                          className={`flex size-7 items-center justify-center rounded-full ${getTimelineColorClasses(event.color)} relative z-10 flex-shrink-0`}
                        >
                          <IconComponent className="size-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {t(event.type)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(event.timestamp).toLocaleString(
                              undefined,
                              {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }
                            )}{' '}
                            <span className="text-[10px]">
                              (<RelativeTime date={event.timestamp} />)
                            </span>
                          </div>
                          {event.user && (
                            <div className="text-muted-foreground mt-0.5 text-xs">
                              {tDetails(`${event.type}By`)}: {event.user}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                      <FileText className="size-3" />
                      {tDetails('notes')}
                    </h3>
                    <div className="bg-muted/30 rounded-lg border p-2 text-xs">
                      {booking.notes}
                    </div>
                  </div>
                </>
              )}

              {/* Activity History - Only show edits, not status changes */}
              {editActivities.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <Collapsible
                    open={showActivities}
                    onOpenChange={setShowActivities}
                  >
                    <div>
                      <CollapsibleTrigger className="w-full">
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                          <Edit className="size-3" />
                          {tDetails('editHistory')}
                          <Badge
                            variant="secondary"
                            className="ml-1 px-1 py-0 text-[10px]"
                          >
                            {editActivities.length}
                          </Badge>
                        </h3>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="max-h-64 space-y-1.5 overflow-y-auto">
                          {editActivities.map((activity) => {
                            const ActivityIcon = getActivityIcon(
                              activity.action
                            );
                            const activityColor = getActivityColor(
                              activity.action
                            );

                            return (
                              <div
                                key={activity.id}
                                className="bg-muted/30 hover:bg-muted/50 flex items-start gap-2 rounded-lg border p-2 transition-colors"
                              >
                                <div
                                  className={`bg-background flex size-5 items-center justify-center rounded-full border ${activityColor.replace(
                                    'text-',
                                    'border-'
                                  )}`}
                                >
                                  <ActivityIcon
                                    className={`size-2.5 ${activityColor}`}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-0.5 flex items-center justify-between gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] capitalize ${activityColor}`}
                                    >
                                      {activity.action}
                                    </Badge>
                                    <div className="text-muted-foreground text-[10px]">
                                      <RelativeTime
                                        date={activity.created_at}
                                      />
                                    </div>
                                  </div>
                                  {activity.old_values &&
                                  activity.new_values ? (
                                    <div className="text-muted-foreground bg-background/50 mt-1 space-y-0.5 rounded border p-1.5 font-mono text-[10px]">
                                      {Object.keys(activity.new_values).map(
                                        (key) => {
                                          if (
                                            activity.old_values![key] !==
                                            activity.new_values![key]
                                          ) {
                                            const changeText =
                                              formatChangeValue(
                                                key,
                                                activity.old_values![key],
                                                activity.new_values![key]
                                              );
                                            if (!changeText) return null;
                                            return (
                                              <div
                                                key={key}
                                                className="truncate"
                                              >
                                                <span className="font-semibold capitalize">
                                                  {key.replace(/_/g, ' ')}:
                                                </span>{' '}
                                                {changeText}
                                              </div>
                                            );
                                          }
                                          return null;
                                        }
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-0.5 text-xs font-medium">
                                      {activity.formatted_changes}
                                    </div>
                                  )}
                                  {activity.user && (
                                    <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[10px]">
                                      <User className="size-2.5" />
                                      <span>{activity.user.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </>
              )}

              {isLoadingActivities && (
                <>
                  <Separator className="my-2" />
                  <div className="text-muted-foreground flex items-center justify-center gap-2 py-3">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
                    <span className="text-xs">
                      {tDetails('loadingActivities')}
                    </span>
                  </div>
                </>
              )}

              {/* Bill Attachments - Only show after offloaded */}
              {permissions.canViewBillAttachments() &&
                (booking.status === 'offloaded' ||
                  booking.status === 'exited') && (
                  <>
                    <Separator className="my-2" />
                    <Collapsible
                      open={showAttachments}
                      onOpenChange={setShowAttachments}
                    >
                      <div>
                        <CollapsibleTrigger className="w-full">
                          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                            <Paperclip className="size-3" />
                            {tDetails('billAttachments')}
                            {booking.bill_attachments &&
                              booking.bill_attachments.length > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="ml-1 px-1 py-0 text-[10px]"
                                >
                                  {booking.bill_attachments.length}
                                </Badge>
                              )}
                          </h3>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CompactBillAttachments
                            vehicle={booking}
                            onUpdate={handleUploadSuccess}
                            onPreview={onPreviewAttachment}
                          />
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </>
                )}

              {/* System Information */}
              <Separator className="my-2" />
              <div>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                  <Info className="size-3" />
                  {tDetails('systemInformation')}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails('bookingId')}
                    </div>
                    <div className="font-mono font-medium">#{booking.id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails('entryDate')}
                    </div>
                    <div className="font-medium">
                      {new Date(booking.entry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails('createdAt')}
                    </div>
                    <div className="font-medium">
                      {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails('lastUpdated')}
                    </div>
                    <div className="font-medium">
                      {new Date(booking.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom spacer for safe area and footer clearance */}
              <div className="h-4 supports-[padding:max(0px)]:h-[max(1rem,env(safe-area-inset-bottom))]"></div>
            </div>
          </div>

          {/* Action Buttons - Show for received status */}
          {booking.status === 'received' && (
            <DrawerFooter className="bg-background flex-shrink-0 border-t px-3 pb-[calc(2rem+env(safe-area-inset-bottom,0))]">
              <div className="flex gap-2">
                {booking.can_exit && onExit && (
                  <Button
                    onClick={() => handleAction(() => onExit(booking))}
                    className="h-9 flex-1 bg-blue-600 text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <LogOut className="me-1.5 size-3.5" />
                    {t('actions.exit')}
                  </Button>
                )}

                {(booking.can_unreceive || booking.can_reject) &&
                  (onUnreceive || onReject) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 px-3">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {booking.can_unreceive && onUnreceive && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(() => onUnreceive(booking))
                            }
                            className="cursor-pointer text-sm"
                          >
                            <RotateCcw className="me-2 size-4" />
                            {t('actions.unreceive')}
                          </DropdownMenuItem>
                        )}
                        {booking.can_reject && onReject && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(() => onReject(booking))
                            }
                            className="cursor-pointer text-sm text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <XCircle className="me-2 size-4" />
                            {t('actions.reject')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
