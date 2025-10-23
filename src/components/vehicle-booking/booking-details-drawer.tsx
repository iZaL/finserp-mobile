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
import type { VehicleBooking, VehicleActivity } from "@/types/vehicle-booking";
import { vehicleBookingService } from "@/lib/services/vehicle-booking";
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
}

export function BookingDetailsDrawer({
  booking,
  open,
  onOpenChange,
  onExit,
  onUnreceive,
  onReject,
}: BookingDetailsDrawerProps) {
  const t = useTranslations("vehicleBookings.bookingCard");
  const tDetails = useTranslations("vehicleBookings.bookingDetails");
  const [activities, setActivities] = useState<VehicleActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showActivities, setShowActivities] = useState(false);

  // Fetch activities when dialog opens and booking changes
  useEffect(() => {
    if (open && booking) {
      setIsLoadingActivities(true);
      vehicleBookingService
        .getBookingActivities(booking.id)
        .then((data) => {
          setActivities(data);
        })
        .catch((error) => {
          console.error("Failed to fetch activities:", error);
          setActivities([]);
        })
        .finally(() => {
          setIsLoadingActivities(false);
        });
    }
  }, [open, booking]);

  // Filter activities to show only edits (not status changes shown in Timeline)
  const editActivities = activities.filter(
    (activity) =>
      activity.action === "updated" ||
      activity.action === "edited" ||
      activity.action === "approval_rejected"
  );

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
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
          <DrawerHeader className="text-left py-2 px-3 flex-shrink-0 border-b">
            <DrawerTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Truck className="size-3.5" />
              </div>
              <div>
                <div className="text-base font-bold">
                  {booking.vehicle_number}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {tDetails("vehicleBookingDetails")}
                </div>
              </div>
            </DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto overflow-x-hidden px-3 py-3 flex-1 min-h-0">
            {/* Added overflow-x-hidden */}
            <div className="space-y-2.5">
              {/* Status Section */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  <StatusIcon className="size-3 me-1.5" />
                  {t(booking.status)}
                </Badge>
                {booking.is_pending_approval && (
                  <Badge className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock className="size-3 me-1.5" />
                    {t("pendingApproval")}
                  </Badge>
                )}
                {booking.approval_status === "rejected" && (
                  <Badge className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle className="size-3 me-1.5" />
                    {t("approvalRejected")}
                  </Badge>
                )}
              </div>

              {/* Creator Information - Prominent */}
              {booking.created_by_name && (
                <div className="p-2 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-6 rounded-full bg-background border text-muted-foreground">
                      <User className="size-3" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-muted-foreground">
                        {tDetails("createdBy")}
                      </div>
                      <div className="font-semibold text-xs">
                        {booking.created_by_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
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
                <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Package className="size-3" />
                  {tDetails("cargoInformation")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5 p-2 rounded-lg border bg-muted/30">
                    <div className="text-[10px] text-muted-foreground">
                      {tDetails("boxCount")}
                    </div>
                    <div className="text-lg font-bold">{booking.box_count}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("boxes")}
                    </div>
                  </div>
                  <div className="space-y-0.5 p-2 rounded-lg border bg-muted/30">
                    <div className="text-[10px] text-muted-foreground">
                      {tDetails("totalWeight")}
                    </div>
                    <div className="text-lg font-bold">
                      {Number(booking.weight_tons || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("tons")}
                    </div>
                  </div>
                  {booking.box_weight_kg && (
                    <div className="space-y-0.5 p-2 rounded-lg border bg-muted/30">
                      <div className="text-[10px] text-muted-foreground">
                        {tDetails("boxWeight")}
                      </div>
                      <div className="text-sm font-semibold flex items-center gap-1">
                        <Weight className="size-3 text-muted-foreground" />
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
                    <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                      <CheckCircle className="size-3 text-emerald-600" />
                      {tDetails("receivedInformation")}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5 p-2 rounded-lg border bg-muted/30">
                        <div className="text-[10px] text-muted-foreground">
                          {tDetails("actualBoxCount")}
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {booking.actual_box_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {t("boxes")}
                        </div>
                      </div>
                      {boxDiscrepancy !== 0 && (
                        <div className="space-y-0.5 p-2 rounded-lg border bg-muted/30">
                          <div className="text-[10px] text-muted-foreground">
                            {tDetails("discrepancy")}
                          </div>
                          <div
                            className={`text-lg font-bold flex items-center gap-1.5 ${
                              boxDiscrepancy > 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {boxDiscrepancy > 0 ? (
                              <TrendingUp className="size-3" />
                            ) : (
                              <TrendingDown className="size-3" />
                            )}
                            {boxDiscrepancy > 0 ? "+" : ""}
                            {boxDiscrepancy}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
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
                  <div className="p-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-red-700 dark:text-red-400">
                      <AlertTriangle className="size-3" />
                      {tDetails("rejectionInformation")}
                    </h3>
                    <div className="space-y-1.5">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">
                          {t("rejectionReason")}
                        </div>
                        <div className="font-medium text-xs text-red-700 dark:text-red-400">
                          {booking.rejection_reason}
                        </div>
                      </div>
                      {booking.rejection_notes && (
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-0.5">
                            {tDetails("additionalNotes")}
                          </div>
                          <div className="text-xs">
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
                  <div className="p-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <Clock className="size-3" />
                      {tDetails("approvalInformation")}
                    </h3>
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      {t("waitingForApproval")}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">
                          {tDetails("notes")}
                        </div>
                        <div className="text-xs">{booking.approval_notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Approval Rejected Information */}
              {booking.approval_status === "rejected" && (
                <>
                  <Separator className="my-2" />
                  <div className="p-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <h3 className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-red-700 dark:text-red-400">
                      <XCircle className="size-3" />
                      {tDetails("approvalRejectedTitle")}
                    </h3>
                    <div className="text-xs text-red-700 dark:text-red-400">
                      {t("approvalRejectedMessage")}
                    </div>
                    {booking.approval_notes && (
                      <div className="mt-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">
                          {tDetails("notes")}
                        </div>
                        <div className="text-xs">{booking.approval_notes}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator className="my-2" />

              {/* Contact Information */}
              <div>
                <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Users className="size-3" />
                  {tDetails("contactInformation")}
                </h3>
                <div className="grid gap-1.5">
                  {booking.driver_name && (
                    <div className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30">
                      <User className="size-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground mb-0.5">
                          {t("driver")}
                        </div>
                        <div className="font-medium text-xs">
                          {booking.driver_name}
                        </div>
                        {booking.driver_phone && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {booking.driver_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {booking.supplier_name && (
                    <div className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30">
                      <Users className="size-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground mb-0.5">
                          {t("supplier")}
                        </div>
                        <div className="font-medium text-xs">
                          {booking.supplier_name}
                        </div>
                        {booking.supplier_phone && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {booking.supplier_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-2" />

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Clock className="size-3" />
                  {tDetails("timeline")}
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center size-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      <Clock className="size-2.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">{t("booked")}</div>
                      <div className="text-[10px] text-muted-foreground">
                        <RelativeTime
                          date={booking.entry_datetime || booking.created_at}
                        />
                      </div>
                      {booking.created_by_name && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {t("createdBy")}: {booking.created_by_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.received_at && (
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center size-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="size-2.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium">
                          {t("received")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          <RelativeTime date={booking.received_at} />
                        </div>
                        {booking.received_by_name && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {tDetails("receivedBy")}: {booking.received_by_name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.exited_at && (
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center size-5 rounded-full bg-muted border">
                        <LogOut className="size-2.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{t("exited")}</div>
                        <div className="text-[10px] text-muted-foreground">
                          <RelativeTime date={booking.exited_at} />
                        </div>
                        {booking.exited_by_name && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {tDetails("exitedBy")}: {booking.exited_by_name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {booking.rejected_at && (
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center size-5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <XCircle className="size-2.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium">
                          {t("rejected")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          <RelativeTime date={booking.rejected_at} />
                        </div>
                        {booking.rejected_by_name && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {tDetails("rejectedBy")}: {booking.rejected_by_name}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

              {/* Bottom spacer for footer clearance */}
              {booking.status === "received" && <div className="h-2"></div>}
            </div>
          </div>

          {/* Action Buttons - Show for received status */}
          {booking.status === "received" && (
            <DrawerFooter className="px-3 pb-8 supports-[padding:max(0px)]:pb-[max(2rem,env(safe-area-inset-bottom))] border-t flex-shrink-0 bg-background">
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
