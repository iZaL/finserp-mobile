"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/relative-time";
import type { VehicleBooking, VehicleActivity, Media } from "@/types/vehicle-booking";
import { vehicleBookingService } from "@/lib/services/vehicle-booking";
import { CompactBillAttachments } from "./compact-bill-attachments";
import { usePermissions } from "@/lib/stores/permission-store";
import { MoreVertical, RotateCcw } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const t = useTranslations("vehicleBookings.bookingCard");
  const tDetails = useTranslations("vehicleBookings.bookingDetails");
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
      .getBookingActivities(booking.id, { signal: abortController.signal })
      .then((data) => {
        setActivities(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error("Failed to fetch activities:", error);
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
      activity.action === "updated" ||
      activity.action === "edited" ||
      activity.action === "approval_rejected"
  );

  // Helper function for timeline item styling
  const getTimelineColorClasses = (color: 'blue' | 'emerald' | 'red' | 'muted') => {
    const colorMap = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
      muted: 'bg-muted border'
    };
    return colorMap[color];
  };

  // Create dynamic timeline events array sorted chronologically
  const timelineEvents = booking ? [
    {
      type: 'booked',
      timestamp: booking.entry_datetime || booking.created_at,
      user: booking.created_by_name,
      icon: Clock,
      color: 'blue' as const
    },
    ...(booking.approved_at ? [{
      type: 'approved',
      timestamp: booking.approved_at,
      user: booking.approved_by_name,
      icon: Shield,
      color: 'emerald' as const
    }] : []),
    ...(booking.received_at ? [{
      type: 'received',
      timestamp: booking.received_at,
      user: booking.received_by_name,
      icon: CheckCircle,
      color: 'emerald' as const
    }] : []),
    ...(booking.offloading_started_at ? [{
      type: 'offloading_started',
      timestamp: booking.offloading_started_at,
      user: booking.offloading_by_name,
      icon: Fish,
      color: 'blue' as const
    }] : []),
    ...(booking.offloading_completed_at ? [{
      type: 'offloading_completed',
      timestamp: booking.offloading_completed_at,
      user: booking.offloaded_by_name,
      icon: Fish,
      color: 'emerald' as const
    }] : []),
    ...(booking.exited_at ? [{
      type: 'exited',
      timestamp: booking.exited_at,
      user: booking.exited_by_name,
      icon: LogOut,
      color: 'muted' as const
    }] : []),
    ...(booking.rejected_at ? [{
      type: 'rejected',
      timestamp: booking.rejected_at,
      user: booking.rejected_by_name,
      icon: XCircle,
      color: 'red' as const
    }] : [])
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

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
      case "booked":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "received":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "exited":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked":
        return Clock;
      case "received":
        return CheckCircle;
      case "exited":
        return LogOut;
      case "rejected":
        return XCircle;
      default:
        return Info;
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
      case "booked":
        return LogIn;
      case "received":
        return CheckCircle;
      case "unreceived":
        return RotateCcw;
      case "exited":
        return LogOut;
      case "rejected":
        return XCircle;
      case "updated":
      case "edited":
        return Edit;
      case "deleted":
        return Trash;
      case "approved":
        return CheckCircle;
      case "approval_rejected":
        return XCircle;
      default:
        return Clock;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "created":
      case "booked":
        return "text-blue-600 dark:text-blue-400";
      case "received":
      case "approved":
        return "text-emerald-600 dark:text-emerald-400";
      case "unreceived":
        return "text-orange-600 dark:text-orange-400";
      case "exited":
        return "text-purple-600 dark:text-purple-400";
      case "rejected":
      case "approval_rejected":
      case "deleted":
        return "text-red-600 dark:text-red-400";
      case "updated":
      case "edited":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatChangeValue = (
    key: string,
    oldValue: string | number | boolean | null | undefined,
    newValue: string | number | boolean | null | undefined
  ): string | null => {
    // Skip system fields and relationships
    if (
      key.includes("_at") ||
      key.includes("_date") ||
      key.includes("_by") ||
      key === "id" ||
      key === "created_at" ||
      key === "updated_at" ||
      key === "creator" ||
      key === "created_by"
    ) {
      return null;
    }

    if (key === "box_count" || key === "actual_box_count") {
      return `${oldValue} → ${newValue} boxes`;
    }
    if (key === "vehicle_number") {
      return `${oldValue} → ${newValue}`;
    }
    if (key === "weight_tons") {
      return `${oldValue} → ${newValue} tons`;
    }
    if (
      key === "driver_name" ||
      key === "driver_phone" ||
      key === "supplier_name" ||
      key === "supplier_phone"
    ) {
      return `${oldValue || "N/A"} → ${newValue || "N/A"}`;
    }
    if (key === "status") {
      return `${oldValue} → ${newValue}`;
    }
    if (key === "rejection_reason") {
      return newValue as string | null;
    }
    if (key === "notes") {
      return "Notes updated";
    }

    return `${oldValue ?? "N/A"} → ${newValue ?? "N/A"}`;
  };

  const StatusIcon = getStatusIcon(booking.status);

  const boxDiscrepancy = booking.actual_box_count
    ? booking.actual_box_count - booking.box_count
    : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100dvh] max-h-[100dvh] sm:h-[95vh] sm:max-h-[95vh]">
        <div className="mx-auto w-full max-w-2xl flex flex-col h-full">
          <DrawerHeader className="text-left py-4 px-4 flex-shrink-0 bg-background border-b">
            <DrawerTitle className="flex items-center justify-between gap-4">
              {/* Left: Icon + Primary Content */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center size-10 rounded-lg border bg-muted/30 text-muted-foreground flex-shrink-0">
                  <Truck className="size-5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                    Vehicle Booking
                  </div>
                  <div className="text-xl font-bold text-foreground truncate">
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
                <StatusIcon className="size-4 mr-2" />
                {t(booking.status)}
              </Badge>
            </DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto overflow-x-hidden px-3 py-3 flex-1 min-h-0">
            {/* Added overflow-x-hidden */}
            <div className="space-y-2.5">

              {/* Creator Information - Compact */}
              {booking.created_by_name && (
                <div className="p-2 rounded-md border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-6 rounded-full bg-background border text-muted-foreground">
                      <User className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{tDetails("createdBy")}:</span>
                        <span className="font-medium truncate">{booking.created_by_name}</span>
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
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Package className="size-4" />
                  {tDetails("cargoInformation")}
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground">
                      {tDetails("boxCount")}
                    </div>
                    <div className="text-xl font-bold">
                      {booking.actual_box_count && booking.actual_box_count !== booking.box_count ? (
                        <span className="flex items-center gap-1">
                          <span className={boxDiscrepancy < 0 ? 'text-red-600 dark:text-red-400' : boxDiscrepancy > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                            {booking.actual_box_count}
                          </span>
                          <span className="text-muted-foreground text-sm">/</span>
                          <span className="text-muted-foreground text-lg">{booking.box_count}</span>
                        </span>
                      ) : (
                        booking.box_count
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("boxes")}
                      {booking.actual_box_count && booking.actual_box_count !== booking.box_count && (
                        <span className={`ml-1 font-medium ${boxDiscrepancy < 0 ? 'text-red-600 dark:text-red-400' : boxDiscrepancy > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          ({boxDiscrepancy > 0 ? '+' : ''}{boxDiscrepancy})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground">
                      {tDetails("totalWeight")}
                    </div>
                    <div className="text-xl font-bold">
                      {Number(booking.weight_tons || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("tons")}
                    </div>
                  </div>
                  {booking.box_weight_kg && (
                    <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                      <div className="text-xs text-muted-foreground">
                        {tDetails("boxWeight")}
                      </div>
                      <div className="text-base font-semibold flex items-center gap-1.5">
                        <Weight className="size-4 text-muted-foreground" />
                        {booking.box_weight_kg} kg
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Received Information */}
              {booking.status === "received" && booking.actual_box_count && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="size-4 text-emerald-600" />
                      {tDetails("receivedInformation")}
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                        <div className="text-xs text-muted-foreground">
                          {tDetails("actualBoxCount")}
                        </div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {booking.actual_box_count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("boxes")}
                        </div>
                      </div>
                      {boxDiscrepancy !== 0 && (
                        <div className="space-y-1 p-3 rounded-lg border bg-muted/30">
                          <div className="text-xs text-muted-foreground">
                            {tDetails("discrepancy")}
                          </div>
                          <div
                            className={`text-xl font-bold flex items-center gap-1.5 ${
                              boxDiscrepancy > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {boxDiscrepancy > 0 ? (
                              <TrendingUp className="size-4" />
                            ) : (
                              <TrendingDown className="size-4" />
                            )}
                            {boxDiscrepancy > 0 ? "+" : ""}
                            {boxDiscrepancy}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {boxDiscrepancy > 0
                              ? tDetails("moreThanExpected")
                              : tDetails("lessThanExpected")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Rejection Information */}
              {booking.status === "rejected" && booking.rejection_reason && (
                <>
                  <Separator className="my-2" />
                  <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="size-4" />
                      {tDetails("rejectionInformation")}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("rejectionReason")}
                        </div>
                        <div className="font-medium text-sm text-red-700 dark:text-red-400">
                          {booking.rejection_reason}
                        </div>
                      </div>
                      {booking.rejection_notes && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {tDetails("additionalNotes")}
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
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Clock className="size-4" />
                      {tDetails("approvalInformation")}
                    </h3>
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      {t("waitingForApproval")}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          {tDetails("notes")}
                        </div>
                        <div className="text-sm">{booking.approval_notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Approval Rejected Information */}
              {booking.approval_status === "rejected" && (
                <>
                  <Separator className="my-2" />
                  <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                      <XCircle className="size-4" />
                      {tDetails("approvalRejectedTitle")}
                    </h3>
                    <div className="text-sm text-red-700 dark:text-red-400">
                      {t("approvalRejectedMessage")}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          {tDetails("notes")}
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
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="size-4" />
                  {tDetails("contactInformation")}
                </h3>
                <div className="grid gap-2">
                  {booking.driver_name && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/30">
                      <User className="size-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("driver")}
                        </div>
                        <div className="font-medium text-sm">
                          {booking.driver_name}
                        </div>
                        {booking.driver_phone && (
                          <a
                            href={`tel:${booking.driver_phone}`}
                            className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono hover:underline"
                          >
                            {booking.driver_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {booking.supplier_name && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/30">
                      <Users className="size-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("supplier")}
                        </div>
                        <div className="font-medium text-sm">
                          {booking.supplier_name}
                        </div>
                        {booking.supplier_phone && (
                          <a
                            href={`tel:${booking.supplier_phone}`}
                            className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono hover:underline"
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
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="size-4" />
                  {tDetails("timeline")}
                </h3>
                <div className="space-y-2.5">
                  {timelineEvents.map((event, index) => {
                    const IconComponent = event.icon;
                    const isLast = index === timelineEvents.length - 1;

                    // Calculate duration to next event
                    let duration = '';
                    if (!isLast) {
                      const nextEvent = timelineEvents[index + 1];
                      const diffMs = new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime();
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

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
                      <div key={index} className="flex items-start gap-2.5 relative">
                        {/* Vertical line with duration */}
                        {!isLast && (
                          <>
                            <div className="absolute left-[13px] top-7 bottom-0 w-[2px] bg-border -mb-2.5" />
                            {duration && (
                              <div className="absolute left-[2px] top-[calc(50%+0.5rem)] text-[9px] font-medium text-muted-foreground bg-background px-1 py-0.5 rounded border border-border whitespace-nowrap shadow-sm">
                                {duration}
                              </div>
                            )}
                          </>
                        )}
                        <div className={`flex items-center justify-center size-7 rounded-full ${getTimelineColorClasses(event.color)} flex-shrink-0 relative z-10`}>
                          <IconComponent className="size-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{t(event.type)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString(undefined, {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}{" "}
                            <span className="text-[10px]">
                              (<RelativeTime date={event.timestamp} />)
                            </span>
                          </div>
                          {event.user && (
                            <div className="text-xs text-muted-foreground mt-0.5">
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
                    <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <FileText className="size-3" />
                      {tDetails("notes")}
                    </h3>
                    <div className="p-2 rounded-lg border bg-muted/30 text-xs">
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
                        <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Edit className="size-3" />
                          {tDetails("editHistory")}
                          <Badge
                            variant="secondary"
                            className="ml-1 text-[10px] px-1 py-0"
                          >
                            {editActivities.length}
                          </Badge>
                        </h3>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
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
                                className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div
                                  className={`flex items-center justify-center size-5 rounded-full bg-background border ${activityColor.replace(
                                    "text-",
                                    "border-"
                                  )}`}
                                >
                                  <ActivityIcon
                                    className={`size-2.5 ${activityColor}`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] capitalize ${activityColor}`}
                                    >
                                      {activity.action}
                                    </Badge>
                                    <div className="text-[10px] text-muted-foreground">
                                      <RelativeTime
                                        date={activity.created_at}
                                      />
                                    </div>
                                  </div>
                                  {activity.old_values &&
                                  activity.new_values ? (
                                    <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1 p-1.5 rounded bg-background/50 border font-mono">
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
                                                  {key.replace(/_/g, " ")}:
                                                </span>{" "}
                                                {changeText}
                                              </div>
                                            );
                                          }
                                          return null;
                                        }
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs font-medium mt-0.5">
                                      {activity.formatted_changes}
                                    </div>
                                  )}
                                  {activity.user && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
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
                  <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-900 dark:border-gray-100"></div>
                    <span className="text-xs">
                      {tDetails("loadingActivities")}
                    </span>
                  </div>
                </>
              )}

              {/* Bill Attachments - Only show after offloaded */}
              {permissions.canViewBillAttachments() &&
               (booking.status === "offloaded" || booking.status === "exited") && (
                <>
                  <Separator className="my-2" />
                  <Collapsible
                    open={showAttachments}
                    onOpenChange={setShowAttachments}
                  >
                    <div>
                      <CollapsibleTrigger className="w-full">
                        <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Paperclip className="size-3" />
                          {tDetails("billAttachments")}
                          {booking.bill_attachments && booking.bill_attachments.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 text-[10px] px-1 py-0"
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
                <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Info className="size-3" />
                  {tDetails("systemInformation")}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails("bookingId")}
                    </div>
                    <div className="font-mono font-medium">#{booking.id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails("entryDate")}
                    </div>
                    <div className="font-medium">
                      {new Date(booking.entry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails("createdAt")}
                    </div>
                    <div className="font-medium">
                      {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">
                      {tDetails("lastUpdated")}
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
          {booking.status === "received" && (
            <DrawerFooter className="px-3 pb-[calc(2rem+env(safe-area-inset-bottom,0))] border-t flex-shrink-0 bg-background">
              <div className="flex gap-2">
                {booking.can_exit && onExit && (
                  <Button
                    onClick={() => handleAction(() => onExit(booking))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 h-9 text-sm"
                  >
                    <LogOut className="size-3.5 me-1.5" />
                    {t("actions.exit")}
                  </Button>
                )}

                {(booking.can_unreceive || booking.can_reject) &&
                  (onUnreceive || onReject) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="px-3 h-9">
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
                            <RotateCcw className="size-4 me-2" />
                            {t("actions.unreceive")}
                          </DropdownMenuItem>
                        )}
                        {booking.can_reject && onReject && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(() => onReject(booking))
                            }
                            className="cursor-pointer text-sm text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <XCircle className="size-4 me-2" />
                            {t("actions.reject")}
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
