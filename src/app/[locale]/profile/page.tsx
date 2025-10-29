"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, BellOff, User, Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/stores/auth-store"
import { usePushNotification } from "@/hooks/use-push-notification"
import { useTranslations } from "next-intl"
import axios from "axios"

interface NotificationPreferences {
  vehicle_bookings: {
    booked: boolean
    received: boolean
    exited: boolean
    rejected: boolean
    approved: boolean
  }
  capacity: {
    alerts: boolean
  }
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotification()
  const abortControllerRef = useRef<AbortController | null>(null)
  const t = useTranslations("profile")

  const defaultPreferences: NotificationPreferences = {
    vehicle_bookings: {
      booked: true,
      received: true,
      exited: true,
      rejected: true,
      approved: true,
    },
    capacity: {
      alerts: true,
    },
  }

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    user?.notification_preferences || defaultPreferences
  )
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Save notification preferences
  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new controller for this request
      abortControllerRef.current = new AbortController()

      setIsSaving(true)
      await api.patch("/user", {
        name: user?.name,
        email: user?.email,
        notification_preferences: preferences,
      }, {
        signal: abortControllerRef.current.signal
      })
      setNotificationPreferences(preferences)
      toast.success("Notification preferences updated")
    } catch (error: unknown) {
      if (!axios.isCancel(error)) {
        toast.error("Failed to save notification preferences")
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsSaving(false)
      }
    }
  }

  // Handle notification preference change
  const handleNotificationChange = (category: keyof NotificationPreferences, type: string, value: boolean) => {
    const newPreferences = {
      ...notificationPreferences,
      [category]: {
        ...notificationPreferences[category],
        [type]: value,
      },
    }
    saveNotificationPreferences(newPreferences)
  }

  // Handle push notification disable with confirmation
  const handleDisableClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmDisable = () => {
    unsubscribe()
    setShowConfirmDialog(false)
  }


  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t("accountInformation")}</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{t("name")}</Label>
            <p className="text-base">{user.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{t("email")}</Label>
            <p className="text-base">{user.email}</p>
          </div>
          {user.phone && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t("phone")}</Label>
              <p className="text-base">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications */}
      {isSupported && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("pushNotifications")}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {isSubscribed ? (
                    <Bell className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium">
                      {isSubscribed ? t("pushNotificationsEnabled") : t("pushNotificationsDisabled")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed
                        ? t("enabledDescription")
                        : t("disabledDescription")
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {isSubscribed ? (
                  <Button
                    variant="outline"
                    onClick={handleDisableClick}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? t("processing") : t("disable")}
                  </Button>
                ) : (
                  <Button
                    onClick={subscribe}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? t("processing") : t("enable")}
                  </Button>
                )}
              </div>
            </div>

            {isSubscribed && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">{t("pushNotificationsActive")}</p>
                    <p className="text-green-800 dark:text-green-200">
                      {t("pushNotificationsActiveDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("notificationPreferences")}</h2>
        </div>

        <div className="space-y-6">
            {/* Vehicle Bookings Section */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">{t("vehicleBookingsSection")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_booked" className="cursor-pointer font-medium">
                      {t("vehicleBooked")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("vehicleBookedDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_booked"
                    checked={notificationPreferences.vehicle_bookings.booked}
                    onCheckedChange={(checked) => handleNotificationChange('vehicle_bookings', 'booked', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_received" className="cursor-pointer font-medium">
                      {t("vehicleReceived")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("vehicleReceivedDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_received"
                    checked={notificationPreferences.vehicle_bookings.received}
                    onCheckedChange={(checked) => handleNotificationChange('vehicle_bookings', 'received', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_exited" className="cursor-pointer font-medium">
                      {t("vehicleExited")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("vehicleExitedDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_exited"
                    checked={notificationPreferences.vehicle_bookings.exited}
                    onCheckedChange={(checked) => handleNotificationChange('vehicle_bookings', 'exited', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_approved" className="cursor-pointer font-medium">
                      {t("vehicleApproved")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("vehicleApprovedDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_approved"
                    checked={notificationPreferences.vehicle_bookings.approved}
                    onCheckedChange={(checked) => handleNotificationChange('vehicle_bookings', 'approved', checked)}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_rejected" className="cursor-pointer font-medium">
                      {t("vehicleRejected")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("vehicleRejectedDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_rejected"
                    checked={notificationPreferences.vehicle_bookings.rejected}
                    onCheckedChange={(checked) => handleNotificationChange('vehicle_bookings', 'rejected', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* System Alerts Section */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">{t("systemAlerts")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_capacity_alerts" className="cursor-pointer font-medium">
                      {t("capacityAlerts")}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("capacityAlertsDescription")}
                    </p>
                  </div>
                  <Switch
                    id="notify_capacity_alerts"
                    checked={notificationPreferences.capacity.alerts}
                    onCheckedChange={(checked) => handleNotificationChange('capacity', 'alerts', checked)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">{t("aboutNotificationPreferences")}</p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• {t("notificationInfo1")}</li>
                    <li>• {t("notificationInfo2")}</li>
                    <li>• {t("notificationInfo3")}</li>
                    <li>• {t("notificationInfo4")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Disable Notifications Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disableNotificationsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disableNotificationsDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>{t("disable")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}