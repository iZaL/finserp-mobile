'use client';

import {memo, useCallback} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Truck,
  Calendar,
  User,
  Users,
  CheckCircle,
  XCircle,
  LogOut,
  RotateCcw,
  Edit,
  Trash2,
  MoreVertical,
  Fish,
  FileText,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {RelativeTime} from '@/components/relative-time';
import {getVehicleStatusColor} from '@/lib/utils/status-colors';
import type {VehicleBooking} from '@/types/vehicle-booking';

interface BookingCardProps {
  booking: VehicleBooking;
  onReceive?: (booking: VehicleBooking) => void;
  onReject?: (booking: VehicleBooking) => void;
  onStartOffloading?: (booking: VehicleBooking) => void;
  onCompleteOffloading?: (booking: VehicleBooking) => void;
  onExit?: (booking: VehicleBooking) => void;
  onUnreceive?: (booking: VehicleBooking) => void;
  onEdit?: (booking: VehicleBooking) => void;
  onDelete?: (booking: VehicleBooking) => void;
  onApprove?: (booking: VehicleBooking) => void;
  onRejectApproval?: (booking: VehicleBooking) => void;
  onClick?: (booking: VehicleBooking) => void;
  isSelected?: boolean;
  onSelectionChange?: (booking: VehicleBooking, selected: boolean) => void;
}

const BookingCardComponent = ({
  booking,
  onReceive,
  onReject,
  onStartOffloading,
  onCompleteOffloading,
  onExit,
  onUnreceive,
  onEdit,
  onDelete,
  onApprove,
  onRejectApproval,
  onClick,
  isSelected = false,
  onSelectionChange,
}: BookingCardProps) => {
  const router = useRouter();
  const t = useTranslations('vehicleBookings.bookingCard');

  const handleAction = useCallback(
    (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
    },
    []
  );

  return (
    <div
      className={`bg-card text-card-foreground relative rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => onClick?.(booking)}
    >
      {/* Swimming Fish Animation - Only show when offloading */}
      {booking.status === 'offloading'}
      {/* Header */}
      <div className="relative z-10 mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Selection Checkbox */}
          {onSelectionChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelectionChange(booking, !!checked)
              }
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="relative flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Truck className="size-5" />
            {/* Corner fish badge for offloading status */}
            {booking.status === 'offloading' && (
              <div className="absolute -top-1.5 -right-1.5 size-6 overflow-hidden rounded-full border-2 border-white bg-amber-100 dark:border-gray-800 dark:bg-amber-900/70">
                <div className="relative h-full w-full">
                  <Fish
                    className="absolute top-1/2 size-3.5 -translate-y-1/2 transform text-amber-600 dark:text-amber-400"
                    style={{
                      animation: 'fishSwimBadge 4s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold">{booking.vehicle_number}</h4>
            <p className="text-muted-foreground text-xs">
              <span className="opacity-60">ID: {booking.id}</span> ·{' '}
              {booking.box_count} {t('boxes')} ·{' '}
              {Number(booking.weight_tons || 0).toFixed(2)} {t('tons')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${getVehicleStatusColor(booking.status)}`}
          >
            {t(booking.status)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="relative z-10 mb-3 grid grid-cols-2 gap-2 text-sm">
        {booking.driver_name && (
          <div className="text-muted-foreground flex items-center gap-2">
            <User className="size-4" />
            <span className="truncate">{booking.driver_name}</span>
          </div>
        )}
        {booking.supplier_name && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Users className="size-4" />
            <span className="truncate">{booking.supplier_name}</span>
          </div>
        )}
        <div className="text-muted-foreground col-span-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span className="text-xs">
              {booking.status === 'exited' && booking.exited_at ? (
                <>
                  {t('exited')}: <RelativeTime date={booking.exited_at} />
                </>
              ) : booking.status === 'offloaded' &&
                booking.offloading_completed_at ? (
                <>
                  {t('offloaded')}:{' '}
                  <RelativeTime date={booking.offloading_completed_at} />
                </>
              ) : booking.status === 'offloading' &&
                booking.offloading_started_at ? (
                <>
                  {t('offloading')}:{' '}
                  <RelativeTime date={booking.offloading_started_at} />
                </>
              ) : booking.status === 'received' && booking.received_at ? (
                <>
                  {t('received')}: <RelativeTime date={booking.received_at} />
                </>
              ) : booking.status === 'rejected' && booking.rejected_at ? (
                <>
                  {t('rejected')}: <RelativeTime date={booking.rejected_at} />
                </>
              ) : (
                <>
                  {t('booked')}:{' '}
                  <RelativeTime
                    date={booking.entry_datetime || booking.created_at}
                  />
                </>
              )}
            </span>
          </div>
          {booking.created_by_name && (
            <div className="flex items-center gap-2">
              <User className="size-4" />
              <span className="text-xs">
                {t('createdBy')}: {booking.created_by_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Received Info */}
      {booking.status === 'received' && booking.actual_box_count && (
        <div className="text-muted-foreground bg-muted/50 relative z-10 mb-3 rounded p-2 text-xs">
          {t('received')}: {booking.actual_box_count} {t('boxes')}
          {booking.actual_box_count !== booking.box_count && (
            <span className="ms-1 font-medium text-orange-600 dark:text-orange-400">
              (Diff:{' '}
              {booking.actual_box_count - booking.box_count > 0 ? '+' : ''}
              {booking.actual_box_count - booking.box_count})
            </span>
          )}
        </div>
      )}

      {/* Rejection Info */}
      {booking.status === 'rejected' && booking.rejection_reason && (
        <div className="text-muted-foreground relative z-10 mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-900/10">
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
        <div className="text-muted-foreground relative z-10 mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800 dark:bg-amber-900/10">
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
        <div className="text-muted-foreground relative z-10 mb-3 rounded border border-red-200 bg-red-50 p-2 text-xs dark:border-red-800 dark:bg-red-900/10">
          <p className="font-medium text-red-600 dark:text-red-400">
            {t('approvalRejectedMessage')}
          </p>
          {booking.approval_notes && (
            <p className="mt-1">{booking.approval_notes}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        {/* Approval Actions - Show when user can approve */}
        {booking.can_approve && onApprove && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleAction(e, () => onApprove(booking))}
              className="border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              <CheckCircle className="me-1.5 size-3" />
              {t('actions.approve')}
            </Button>
            {onRejectApproval && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-2 py-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) =>
                      handleAction(e, () => onRejectApproval(booking))
                    }
                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <XCircle className="me-2 size-3" />
                    {t('actions.rejectApproval')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}

        {/* Booked Status Actions */}
        {booking.status === 'booked' && !booking.can_approve && (
          <>
            {booking.can_receive && onReceive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAction(e, () => onReceive(booking))}
                className="border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <CheckCircle className="me-1.5 size-3" />
                {t('actions.receive')}
              </Button>
            )}
            {(booking.can_edit || booking.can_delete || booking.can_reject) &&
              (onEdit || onDelete || onReject) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 py-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {booking.can_edit && onEdit && (
                      <DropdownMenuItem
                        onClick={(e) => handleAction(e, () => onEdit(booking))}
                        className="cursor-pointer"
                      >
                        <Edit className="me-2 size-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                    )}
                    {booking.can_reject && onReject && (
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleAction(e, () => onReject(booking))
                        }
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      >
                        <XCircle className="me-2 size-4" />
                        {t('actions.reject')}
                      </DropdownMenuItem>
                    )}
                    {booking.can_delete && onDelete && (
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleAction(e, () => onDelete(booking))
                        }
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      >
                        <Trash2 className="me-2 size-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </>
        )}

        {/* Received Status Actions */}
        {booking.status === 'received' && (
          <>
            {booking.can_start_offloading && onStartOffloading && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) =>
                  handleAction(e, () => onStartOffloading(booking))
                }
                className="border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <CheckCircle className="me-1.5 size-3" />
                {t('actions.startOffloading')}
              </Button>
            )}
            {(booking.can_unreceive || booking.can_reject) &&
              (onUnreceive || onReject) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-2 py-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {booking.can_unreceive && onUnreceive && (
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleAction(e, () => onUnreceive(booking))
                        }
                        className="cursor-pointer"
                      >
                        <RotateCcw className="me-2 size-4" />
                        {t('actions.unreceive')}
                      </DropdownMenuItem>
                    )}
                    {booking.can_reject && onReject && (
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleAction(e, () => onReject(booking))
                        }
                        className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      >
                        <XCircle className="me-2 size-4" />
                        {t('actions.reject')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </>
        )}

        {/* Offloading Status Actions */}
        {booking.status === 'offloading' && (
          <>
            {booking.can_complete_offloading && onCompleteOffloading && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) =>
                  handleAction(e, () => onCompleteOffloading(booking))
                }
                className="border-emerald-300 bg-white px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <CheckCircle className="me-1.5 size-3" />
                {t('actions.completeOffloading')}
              </Button>
            )}
          </>
        )}

        {/* Offloaded Status Actions */}
        {booking.status === 'offloaded' && (
          <>
            {/* Create Fish Purchase Bill Button */}
            {!booking.fish_purchase_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  handleAction(e, () =>
                    router.push(
                      `/fish-purchases/new?vehicle_booking_id=${booking.id}`
                    )
                  );
                }}
                className="border-purple-300 bg-white px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:bg-slate-800 dark:text-purple-400 dark:hover:bg-purple-950"
              >
                <FileText className="me-1.5 size-3" />
                {t('actions.createFishPurchase')}
              </Button>
            )}

            {/* Show linked fish purchase bill if exists */}
            {booking.fish_purchase_id && booking.fish_purchase_bill_number && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) =>
                  handleAction(e, () =>
                    router.push(`/fish-purchases/${booking.fish_purchase_id}`)
                  )
                }
                className="border-purple-300 bg-white px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:bg-slate-800 dark:text-purple-400 dark:hover:bg-purple-950"
              >
                <FileText className="me-1.5 size-3" />
                {booking.fish_purchase_bill_number}
              </Button>
            )}

            {booking.can_exit && onExit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAction(e, () => onExit(booking))}
                className="border-blue-300 bg-white px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <LogOut className="me-1.5 size-3" />
                {t('actions.exit')}
              </Button>
            )}
          </>
        )}

        {/* Exited/Rejected Status - No Actions */}
        {(booking.status === 'exited' ||
          booking.status === 'rejected' ||
          booking.status === 'pending') &&
          null}
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render when props actually change
export const BookingCard = memo(BookingCardComponent);
