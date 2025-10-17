"use client"

import { useTranslations } from "next-intl"
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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RelativeTime } from "@/components/relative-time"
import type { VehicleBooking } from "@/types/vehicle-booking"

interface BookingDetailsDialogProps {
  booking: VehicleBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) {
  const t = useTranslations('vehicleBookings.bookingCard')
  const tDetails = useTranslations('vehicleBookings.bookingDetails')

  if (!booking) return null

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "booked":
        return Clock
      case "received":
        return CheckCircle
      case "exited":
        return LogOut
      case "rejected":
        return XCircle
      default:
        return Info
    }
  }

  const StatusIcon = getStatusIcon(booking.status)

  const boxDiscrepancy = booking.actual_box_count
    ? booking.actual_box_count - booking.box_count
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Truck className="size-6" />
            </div>
            <div>
              <div className="text-xl font-bold">{booking.vehicle_number}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {tDetails('vehicleBookingDetails')}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Section */}
          <div className="flex items-center gap-3">
            <Badge className={`px-3 py-1.5 text-sm font-medium ${getStatusColor(booking.status)}`}>
              <StatusIcon className="size-4 me-2" />
              {t(booking.status)}
            </Badge>
            {booking.is_pending_approval && (
              <Badge className="px-3 py-1.5 text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="size-4 me-2" />
                {t('pendingApproval')}
              </Badge>
            )}
            {booking.approval_status === 'rejected' && (
              <Badge className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <AlertTriangle className="size-4 me-2" />
                {t('approvalRejected')}
              </Badge>
            )}
          </div>

          {/* Creator Information - Prominent */}
          {booking.created_by_name && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <User className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{tDetails('createdBy')}</div>
                  <div className="font-semibold text-blue-900 dark:text-blue-100">
                    {booking.created_by_name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <RelativeTime date={booking.entry_datetime || booking.created_at} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Cargo Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="size-4" />
              {tDetails('cargoInformation')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{tDetails('boxCount')}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {booking.box_count}
                </div>
                <div className="text-xs text-muted-foreground">{t('boxes')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{tDetails('totalWeight')}</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Number(booking.weight_tons || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">{t('tons')}</div>
              </div>
              {booking.box_weight_kg && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{tDetails('boxWeight')}</div>
                  <div className="text-lg font-semibold flex items-center gap-1">
                    <Weight className="size-4 text-gray-500" />
                    {booking.box_weight_kg} kg
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Received Information */}
          {booking.status === "received" && booking.actual_box_count && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="size-4 text-emerald-600" />
                  {tDetails('receivedInformation')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{tDetails('actualBoxCount')}</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {booking.actual_box_count}
                    </div>
                    <div className="text-xs text-muted-foreground">{t('boxes')}</div>
                  </div>
                  {boxDiscrepancy !== 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{tDetails('discrepancy')}</div>
                      <div className={`text-2xl font-bold flex items-center gap-2 ${
                        boxDiscrepancy > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {boxDiscrepancy > 0 ? (
                          <TrendingUp className="size-5" />
                        ) : (
                          <TrendingDown className="size-5" />
                        )}
                        {boxDiscrepancy > 0 ? '+' : ''}{boxDiscrepancy}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {boxDiscrepancy > 0 ? tDetails('moreThanExpected') : tDetails('lessThanExpected')}
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
              <Separator />
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="size-4" />
                  {tDetails('rejectionInformation')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('rejectionReason')}</div>
                    <div className="font-medium text-red-700 dark:text-red-400">
                      {booking.rejection_reason}
                    </div>
                  </div>
                  {booking.rejection_notes && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{tDetails('additionalNotes')}</div>
                      <div className="text-sm">{booking.rejection_notes}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Approval Information */}
          {booking.is_pending_approval && (
            <>
              <Separator />
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="size-4" />
                  {tDetails('approvalInformation')}
                </h3>
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  {t('waitingForApproval')}
                </div>
                {booking.approval_notes && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">{tDetails('notes')}</div>
                    <div className="text-sm">{booking.approval_notes}</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Approval Rejected Information */}
          {booking.approval_status === 'rejected' && (
            <>
              <Separator />
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle className="size-4" />
                  {tDetails('approvalRejectedTitle')}
                </h3>
                <div className="text-sm text-red-700 dark:text-red-400">
                  {t('approvalRejectedMessage')}
                </div>
                {booking.approval_notes && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">{tDetails('notes')}</div>
                    <div className="text-sm">{booking.approval_notes}</div>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="size-4" />
              {tDetails('contactInformation')}
            </h3>
            <div className="grid gap-3">
              {booking.driver_name && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{t('driver')}</div>
                    <div className="font-medium">{booking.driver_name}</div>
                    {booking.driver_phone && (
                      <div className="text-sm text-muted-foreground mt-1">{booking.driver_phone}</div>
                    )}
                  </div>
                </div>
              )}
              {booking.supplier_name && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="size-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">{t('supplier')}</div>
                    <div className="font-medium">{booking.supplier_name}</div>
                    {booking.supplier_phone && (
                      <div className="text-sm text-muted-foreground mt-1">{booking.supplier_phone}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="size-4" />
              {tDetails('timeline')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Clock className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('booked')}</div>
                  <div className="text-xs text-muted-foreground">
                    <RelativeTime date={booking.entry_datetime || booking.created_at} />
                  </div>
                  {booking.created_by_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('createdBy')}: {booking.created_by_name}
                    </div>
                  )}
                </div>
              </div>

              {booking.received_at && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t('received')}</div>
                    <div className="text-xs text-muted-foreground">
                      <RelativeTime date={booking.received_at} />
                    </div>
                    {booking.received_by_name && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tDetails('receivedBy')}: {booking.received_by_name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.exited_at && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <LogOut className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t('exited')}</div>
                    <div className="text-xs text-muted-foreground">
                      <RelativeTime date={booking.exited_at} />
                    </div>
                    {booking.exited_by_name && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tDetails('exitedBy')}: {booking.exited_by_name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.rejected_at && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <XCircle className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t('rejected')}</div>
                    <div className="text-xs text-muted-foreground">
                      <RelativeTime date={booking.rejected_at} />
                    </div>
                    {booking.rejected_by_name && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {tDetails('rejectedBy')}: {booking.rejected_by_name}
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
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="size-4" />
                  {tDetails('notes')}
                </h3>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  {booking.notes}
                </div>
              </div>
            </>
          )}

          {/* System Information */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Info className="size-4" />
              {tDetails('systemInformation')}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">{tDetails('bookingId')}</div>
                <div className="font-mono font-medium">#{booking.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">{tDetails('entryDate')}</div>
                <div className="font-medium">
                  {new Date(booking.entry_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">{tDetails('createdAt')}</div>
                <div className="font-medium">
                  {new Date(booking.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">{tDetails('lastUpdated')}</div>
                <div className="font-medium">
                  {new Date(booking.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
