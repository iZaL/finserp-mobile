"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Car, Plus, BarChart3, ClipboardList, FileText, Lock } from "lucide-react"
import { usePermissions } from "@/lib/stores/permission-store"
import { BookingStatusBanner } from "@/components/booking-status-banner"
import { NotificationWelcomeModal } from "@/components/notification-welcome-modal"
import { NotificationEnableBanner } from "@/components/notification-enable-banner"
import { useVehicleBookingSettings } from "@/hooks/use-vehicle-bookings"
import { usePushNotification } from "@/hooks/use-push-notification"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Home() {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tBookingStatus = useTranslations('bookingStatus')
  const permissions = usePermissions()
  const { data: settings, isLoading: settingsLoading } = useVehicleBookingSettings()
  const { isSupported, isSubscribed } = usePushNotification()

  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)

  const isBookingEnabled = settings?.vehicle_booking_enabled ?? true

  // Debug logging
  useEffect(() => {
    if (!settingsLoading) {
      console.log('Dashboard settings:', {
        settings,
        vehicle_booking_enabled: settings?.vehicle_booking_enabled,
        isBookingEnabled,
        settingsLoading
      })
    }
  }, [settings, isBookingEnabled, settingsLoading])

  // Check if we should show notification modal or banner
  useEffect(() => {
    if (!isSupported || isSubscribed) {
      return
    }

    const hasSeenModal = localStorage.getItem("notification-modal-seen") === "true"

    if (!hasSeenModal) {
      // Show modal if never seen before
      setShowNotificationModal(true)
    } else {
      // Show banner if modal was dismissed but notifications not enabled
      setShowNotificationBanner(true)
    }
  }, [isSupported, isSubscribed])

  const handleModalDismiss = () => {
    setShowNotificationModal(false)
    setShowNotificationBanner(true)
  }

  return (
    <>
      {/* Notification Welcome Modal */}
      <NotificationWelcomeModal
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
        onDismiss={handleModalDismiss}
      />

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground mt-1">
          {t('welcome')}
        </p>
      </div>

      {/* Notification Enable Banner - Always visible if not subscribed */}
      {showNotificationBanner && <NotificationEnableBanner />}

      {/* Booking Status Banner */}
      {!settingsLoading && (
        <BookingStatusBanner isEnabled={isBookingEnabled} />
      )}

      {/* Vehicle Booking Management Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">{t('vehicleBookings')}</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            onClick={() => router.push("/vehicle-bookings")}
            className="h-auto flex-col items-start gap-2 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ClipboardList className="size-5" />
            <div className="text-start">
              <div className="font-semibold">{t('viewBookings')}</div>
              <div className="text-xs opacity-90 font-normal">{t('manageVehicles')}</div>
            </div>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    onClick={() => !isBookingEnabled ? null : router.push("/vehicle-bookings/new")}
                    disabled={!isBookingEnabled}
                    className="h-auto flex-col items-start gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {!isBookingEnabled && (
                      <Lock className="absolute top-2 right-2 size-4 text-white" />
                    )}
                    <Plus className="size-5" />
                    <div className="text-start">
                      <div className="font-semibold">{t('newBooking')}</div>
                      <div className="text-xs opacity-90 font-normal">{t('addNewBooking')}</div>
                    </div>
                  </Button>
                </div>
              </TooltipTrigger>
              {!isBookingEnabled && (
                <TooltipContent>
                  <p>{tBookingStatus('closedDescription')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => router.push("/vehicle-bookings/calendar")}
            className="h-auto flex-col items-start gap-2 p-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            <BarChart3 className="size-5" />
            <div className="text-start">
              <div className="font-semibold">{t('statistics')}</div>
              <div className="text-xs opacity-90 font-normal">{t('viewStatistics')}</div>
            </div>
          </Button>

          {permissions.canViewBillAttachments() && (
            <Button
              onClick={() => router.push("/vehicle-bookings/bills")}
              className="h-auto flex-col items-start gap-2 p-4 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              <FileText className="size-5" />
              <div className="text-start">
                <div className="font-semibold">{t('vehicleBills')}</div>
                <div className="text-xs opacity-90 font-normal">{t('manageBills')}</div>
              </div>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
