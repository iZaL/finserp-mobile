"use client"

import { useTranslations } from "next-intl"
import { Truck, Calendar, User, Users, CheckCircle, XCircle, LogOut, RotateCcw, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RelativeTime } from "@/components/relative-time"
import type { VehicleBooking } from "@/types/vehicle-booking"

interface BookingCardProps {
  booking: VehicleBooking
  onReceive?: (booking: VehicleBooking) => void
  onReject?: (booking: VehicleBooking) => void
  onExit?: (booking: VehicleBooking) => void
  onUnreceive?: (booking: VehicleBooking) => void
  onEdit?: (booking: VehicleBooking) => void
  onDelete?: (booking: VehicleBooking) => void
  onApprove?: (booking: VehicleBooking) => void
  onRejectApproval?: (booking: VehicleBooking) => void
  onClick?: (booking: VehicleBooking) => void
  isSelected?: boolean
  onSelectionChange?: (booking: VehicleBooking, selected: boolean) => void
}

export function BookingCard({
  booking,
  onReceive,
  onReject,
  onExit,
  onUnreceive,
  onEdit,
  onDelete,
  onApprove,
  onRejectApproval,
  onClick,
  isSelected = false,
  onSelectionChange,
}: BookingCardProps) {
  const t = useTranslations('vehicleBookings.bookingCard')

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "received":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "exited":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }


  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-all ${
        isSelected ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() => onClick?.(booking)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Selection Checkbox */}
          {onSelectionChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange(booking, !!checked)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex items-center justify-center size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Truck className="size-5" />
          </div>
          <div>
            <h4 className="font-semibold">{booking.vehicle_number}</h4>
            <p className="text-xs text-muted-foreground">
              {booking.box_count} {t('boxes')} · {Number(booking.weight_tons || 0).toFixed(2)} {t('tons')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              booking.status
            )}`}
          >
            {t(booking.status)}
          </span>
          {booking.is_pending_approval && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {t('pendingApproval')}
            </span>
          )}
          {booking.approval_status === 'rejected' && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {t('approvalRejected')}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {booking.driver_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4" />
            <span className="truncate">{booking.driver_name}</span>
          </div>
        )}
        {booking.supplier_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="truncate">{booking.supplier_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
          <Calendar className="size-4" />
          <span className="text-xs">
            {t('booked')}: <RelativeTime date={booking.entry_datetime || booking.created_at} />
          </span>
        </div>
        {booking.created_by_name && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <User className="size-4" />
            <span className="text-xs">
              {t('createdBy')}: {booking.created_by_name}
            </span>
          </div>
        )}
      </div>

      {/* Received Info */}
      {booking.status === "received" && booking.actual_box_count && (
        <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
          {t('received')}: {booking.actual_box_count} {t('boxes')}
          {booking.actual_box_count !== booking.box_count && (
            <span className="font-medium text-orange-600 dark:text-orange-400 ms-1">
              (Diff: {booking.actual_box_count - booking.box_count > 0 ? "+" : ""}
              {booking.actual_box_count - booking.box_count})
            </span>
          )}
        </div>
      )}

      {/* Rejection Info */}
      {booking.status === "rejected" && booking.rejection_reason && (
        <div className="text-xs text-muted-foreground mb-3 p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
          <p className="font-medium text-red-600 dark:text-red-400">
            {t('rejected')}: {booking.rejection_reason}
          </p>
          {booking.rejection_notes && (
            <p className="mt-1">{booking.rejection_notes}</p>
          )}
        </div>
      )}

      {/* Approval Pending Info */}
      {booking.is_pending_approval && (
        <div className="text-xs text-muted-foreground mb-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800">
          <p className="font-medium text-amber-600 dark:text-amber-400">
            {t('waitingForApproval')}
          </p>
          {booking.approval_notes && (
            <p className="mt-1">{booking.approval_notes}</p>
          )}
        </div>
      )}

      {/* Approval Rejected Info */}
      {booking.approval_status === 'rejected' && (
        <div className="text-xs text-muted-foreground mb-3 p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
          <p className="font-medium text-red-600 dark:text-red-400">
            {t('approvalRejectedMessage')}
          </p>
          {booking.approval_notes && (
            <p className="mt-1">{booking.approval_notes}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Approval Actions - Show when user can approve */}
        {booking.can_approve && onApprove && onRejectApproval && (
          <>
            <Button
              size="sm"
              onClick={(e) => handleAction(e, () => onApprove(booking))}
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              <CheckCircle className="size-4 me-1" />
              {t('actions.approve')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => handleAction(e, () => onRejectApproval(booking))}
              className="flex-1"
            >
              <XCircle className="size-4 me-1" />
              {t('actions.rejectApproval')}
            </Button>
          </>
        )}

        {/* Booked Status Actions */}
        {booking.status === "booked" && !booking.can_approve && (
          <>
            {booking.can_receive && onReceive && (
              <Button
                size="sm"
                onClick={(e) => handleAction(e, () => onReceive(booking))}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <CheckCircle className="size-4 me-1" />
                {t('actions.receive')}
              </Button>
            )}
            {booking.can_reject && onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => handleAction(e, () => onReject(booking))}
                className="flex-1"
              >
                <XCircle className="size-4 me-1" />
                {t('actions.reject')}
              </Button>
            )}
            {booking.can_edit && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAction(e, () => onEdit(booking))}
              >
                <Edit className="size-4 me-1" />
                {t('actions.edit')}
              </Button>
            )}
            {booking.can_delete && onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAction(e, () => onDelete(booking))}
              >
                <Trash2 className="size-4 me-1" />
                {t('actions.delete')}
              </Button>
            )}
          </>
        )}

        {/* Received Status Actions */}
        {booking.status === "received" && (
          <>
            {booking.can_exit && onExit && (
              <Button
                size="sm"
                onClick={(e) => handleAction(e, () => onExit(booking))}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <LogOut className="size-4 me-1" />
                {t('actions.exit')}
              </Button>
            )}
            {booking.can_unreceive && onUnreceive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAction(e, () => onUnreceive(booking))}
                className="flex-1"
              >
                <RotateCcw className="size-4 me-1" />
                {t('actions.unreceive')}
              </Button>
            )}
            {booking.can_reject && onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => handleAction(e, () => onReject(booking))}
                className="flex-1"
              >
                <XCircle className="size-4 me-1" />
                {t('actions.reject')}
              </Button>
            )}
          </>
        )}

        {/* Exited/Rejected Status - No Actions */}
        {(booking.status === "exited" || booking.status === "rejected") && (
          <div className="text-xs text-muted-foreground text-center w-full py-1">
            {t('noActions')}
          </div>
        )}
      </div>
    </div>
  )
}
