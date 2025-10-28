"use client"

import { useState, useEffect } from "react"
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


  // Save notification preferences
  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      setIsSaving(true)
      await api.patch("/user", {
        name: user?.name,
        email: user?.email,
        notification_preferences: preferences,
      })
      setNotificationPreferences(preferences)
      toast.success("Notification preferences updated")
    } catch (error) {
      toast.error("Failed to save notification preferences")
    } finally {
      setIsSaving(false)
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
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Name</Label>
            <p className="text-base">{user.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Email</Label>
            <p className="text-base">{user.email}</p>
          </div>
          {user.phone && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
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
            <h2 className="text-lg font-semibold">Push Notifications</h2>
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
                      {isSubscribed ? "Push Notifications Enabled" : "Push Notifications Disabled"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed
                        ? "You'll receive push notifications for vehicle bookings and system alerts"
                        : "Enable push notifications to receive real-time updates"
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
                    {isLoading ? "Processing..." : "Disable"}
                  </Button>
                ) : (
                  <Button
                    onClick={subscribe}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? "Processing..." : "Enable"}
                  </Button>
                )}
              </div>
            </div>

            {isSubscribed && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">Push notifications are active</p>
                    <p className="text-green-800 dark:text-green-200">
                      You can control which specific notifications you receive using the settings below.
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
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>

        <div className="space-y-6">
            {/* Vehicle Bookings Section */}
            <div className="space-y-4">
              <h3 className="text-base font-medium">Vehicle Bookings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_booked" className="cursor-pointer font-medium">
                      Vehicle Booked
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when a vehicle booking is created
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
                      Vehicle Received
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when a vehicle is received at the facility
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
                      Vehicle Exited
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when a vehicle exits the facility
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
                      Vehicle Approved
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when a vehicle booking is approved
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
                      Vehicle Rejected
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when a vehicle booking is rejected
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
              <h3 className="text-base font-medium">System Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                  <div className="flex-1">
                    <Label htmlFor="notify_capacity_alerts" className="cursor-pointer font-medium">
                      Capacity Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified about capacity limit warnings and status
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
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">About notification preferences</p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• These settings control which notifications you receive personally</li>
                    <li>• Changes apply immediately to future notifications</li>
                    <li>• You can enable or disable specific notification types as needed</li>
                    <li>• Notifications may be delivered via the application or WhatsApp</li>
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
            <AlertDialogTitle>Disable Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive push notifications for vehicle bookings. You can re-enable them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>Disable</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}