'use client';

import {useState, useEffect, useRef} from 'react';
import {Bell, User, Info} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {toast} from 'sonner';
import {api} from '@/lib/api';
import {useAuthStore} from '@/lib/stores/auth-store';
import {usePushNotification} from '@/hooks/use-push-notification';
import {useTranslations} from 'next-intl';
import axios from 'axios';

interface NotificationPreferences {
  vehicle_bookings: {
    booked: boolean;
    received: boolean;
    offloading: boolean;
    offloaded: boolean;
    exited: boolean;
    rejected: boolean;
    approved: boolean;
  };
  capacity: {
    alerts: boolean;
  };
}

export default function ProfilePage() {
  const {user} = useAuthStore();
  const {isSupported, isSubscribed, isLoading, subscribe, unsubscribe} =
    usePushNotification();
  const abortControllerRef = useRef<AbortController | null>(null);
  const t = useTranslations('profile');

  const defaultPreferences: NotificationPreferences = {
    vehicle_bookings: {
      booked: true,
      received: true,
      offloading: true,
      offloaded: true,
      exited: true,
      rejected: true,
      approved: true,
    },
    capacity: {
      alerts: true,
    },
  };

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(
      user?.notification_preferences || defaultPreferences
    );
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sync notification preferences when user changes
  useEffect(() => {
    if (user?.notification_preferences) {
      setNotificationPreferences(user.notification_preferences);
    }
  }, [user?.notification_preferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save notification preferences
  const saveNotificationPreferences = async (
    preferences: NotificationPreferences
  ) => {
    try {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new controller for this request
      abortControllerRef.current = new AbortController();

      setIsSaving(true);
      await api.patch(
        '/user',
        {
          name: user?.name,
          email: user?.email,
          notification_preferences: preferences,
        },
        {
          signal: abortControllerRef.current.signal,
        }
      );
      setNotificationPreferences(preferences);
      toast.success('Notification preferences updated');
    } catch (error: unknown) {
      if (!axios.isCancel(error)) {
        toast.error('Failed to save notification preferences');
      }
    } finally {
      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        setIsSaving(false);
      }
    }
  };

  // Handle notification preference change
  const handleNotificationChange = (
    category: keyof NotificationPreferences,
    type: string,
    value: boolean
  ) => {
    const newPreferences = {
      ...notificationPreferences,
      [category]: {
        ...notificationPreferences[category],
        [type]: value,
      },
    };
    saveNotificationPreferences(newPreferences);
  };

  // Handle push notification disable with confirmation
  const handleDisableClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDisable = () => {
    unsubscribe();
    setShowConfirmDialog(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
          <User className="text-primary h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t('accountInformation')}
        </h2>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm font-medium">
              {t('name')}
            </Label>
            <p className="text-base">{user.name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm font-medium">
              {t('email')}
            </Label>
            <p className="text-base">{user.email}</p>
          </div>
          {user.phone && (
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                {t('phone')}
              </Label>
              <p className="text-base">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications */}
      {isSupported && (
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="text-primary h-5 w-5" />
              <h2 className="text-lg font-semibold">
                {t('pushNotifications')}
              </h2>
            </div>
            <div className="flex-shrink-0">
              {isSubscribed ? (
                <Button
                  variant="outline"
                  onClick={handleDisableClick}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? t('processing') : t('disable')}
                </Button>
              ) : (
                <Button onClick={subscribe} disabled={isLoading} size="sm">
                  {isLoading ? t('processing') : t('enable')}
                </Button>
              )}
            </div>
          </div>

          {isSubscribed && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div className="text-sm">
                  <p className="mb-1 font-medium text-green-900 dark:text-green-100">
                    {t('pushNotificationsActive')}
                  </p>
                  <p className="text-green-800 dark:text-green-200">
                    {t('pushNotificationsActiveDescription')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-card rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="text-primary h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {t('notificationPreferences')}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Vehicle Bookings Section */}
          <div className="space-y-2">
            <h3 className="text-base font-medium">
              {t('vehicleBookingsSection')}
            </h3>
            <div className="space-y-2">
              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_booked"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleBooked')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleBookedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_booked"
                  checked={notificationPreferences.vehicle_bookings.booked}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'booked',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_received"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleReceived')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleReceivedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_received"
                  checked={notificationPreferences.vehicle_bookings.received}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'received',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_offloading"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleOffloadingStarted')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleOffloadingStartedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_offloading"
                  checked={notificationPreferences.vehicle_bookings.offloading}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'offloading',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_offloaded"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleOffloadingCompleted')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleOffloadingCompletedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_offloaded"
                  checked={notificationPreferences.vehicle_bookings.offloaded}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'offloaded',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_exited"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleExited')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleExitedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_exited"
                  checked={notificationPreferences.vehicle_bookings.exited}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'exited',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_approved"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleApproved')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleApprovedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_approved"
                  checked={notificationPreferences.vehicle_bookings.approved}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'approved',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_rejected"
                    className="cursor-pointer font-medium"
                  >
                    {t('vehicleRejected')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('vehicleRejectedDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_rejected"
                  checked={notificationPreferences.vehicle_bookings.rejected}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(
                      'vehicle_bookings',
                      'rejected',
                      checked
                    )
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* System Alerts Section */}
          <div className="space-y-2">
            <h3 className="text-base font-medium">{t('systemAlerts')}</h3>
            <div className="space-y-2">
              <div className="bg-muted/20 flex items-center justify-between rounded-md p-2.5">
                <div className="flex-1">
                  <Label
                    htmlFor="notify_capacity_alerts"
                    className="cursor-pointer font-medium"
                  >
                    {t('capacityAlerts')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t('capacityAlertsDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_capacity_alerts"
                  checked={notificationPreferences.capacity.alerts}
                  onCheckedChange={(checked) =>
                    handleNotificationChange('capacity', 'alerts', checked)
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-sm">
                <p className="mb-1 font-medium text-blue-900 dark:text-blue-100">
                  {t('aboutNotificationPreferences')}
                </p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                  <li>• {t('notificationInfo1')}</li>
                  <li>• {t('notificationInfo2')}</li>
                  <li>• {t('notificationInfo3')}</li>
                  <li>• {t('notificationInfo4')}</li>
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
            <AlertDialogTitle>
              {t('disableNotificationsTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('disableNotificationsDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>
              {t('disable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
