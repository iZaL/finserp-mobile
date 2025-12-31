'use client';

import {useState, useEffect, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Settings2,
  Package,
  ChevronRight,
  Loader2,
  TrendingUp,
  Power,
  CheckCircle,
  Shield,
} from 'lucide-react';
import {toast} from 'sonner';
import {api} from '@/lib/api';
import {useUpdateControlSettings} from '@/hooks/use-vehicle-bookings';
import axios from 'axios';

export default function SettingsPage() {
  const t = useTranslations();
  const updateControlSettings = useUpdateControlSettings();
  const [boxLimit, setBoxLimit] = useState<number>(5000);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [defaultBoxWeight, setDefaultBoxWeight] = useState<number>(20);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // Control settings state
  const [vehicleBookingEnabled, setVehicleBookingEnabled] =
    useState<boolean>(true);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);
  const [allowOverride, setAllowOverride] = useState<boolean>(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<string | null>(
    null
  );

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    setting:
      | 'vehicle_booking_enabled'
      | 'require_vehicle_booking_approval'
      | 'allow_vehicle_booking_override';
    value: boolean;
  } | null>(null);

  // Fetch current settings
  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsFetching(true);

      // Get general settings for default box weight and control settings
      const settingsResponse = await api.get(
        '/fish-purchase-vehicles/settings',
        {signal}
      );
      if (settingsResponse.data?.data) {
        const settings = settingsResponse.data.data;
        if (settings.default_box_weight_kg) {
          setDefaultBoxWeight(settings.default_box_weight_kg);
        }
        setVehicleBookingEnabled(settings.vehicle_booking_enabled ?? true);
        setRequireApproval(settings.require_vehicle_booking_approval ?? false);
        setAllowOverride(settings.allow_vehicle_booking_override ?? true);
      }

      // Get daily capacity for today
      const today = new Date().toISOString().split('T')[0];
      const capacityResponse = await api.get(
        `/fish-purchase-vehicles/daily-capacity?date=${today}`,
        {signal}
      );

      if (capacityResponse.data?.data) {
        setBoxLimit(capacityResponse.data.data.daily_limit_boxes || 5000);
      }
    } catch (error: unknown) {
      if (!axios.isCancel(error)) {
        console.error('Failed to fetch settings:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchSettings(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchSettings]);

  // Helper functions for confirmation dialog content
  const getConfirmationContent = (
    setting:
      | 'vehicle_booking_enabled'
      | 'require_vehicle_booking_approval'
      | 'allow_vehicle_booking_override',
    value: boolean
  ) => {
    const settingNames = {
      vehicle_booking_enabled: t(
        'settings.vehicleBooking.confirmDialog.systemTitle'
      ),
      require_vehicle_booking_approval: t(
        'settings.vehicleBooking.confirmDialog.approvalTitle'
      ),
      allow_vehicle_booking_override: t(
        'settings.vehicleBooking.confirmDialog.overrideTitle'
      ),
    };

    const messages = {
      vehicle_booking_enabled: {
        enable: t('settings.vehicleBooking.confirmDialog.systemEnableMessage'),
        disable: t(
          'settings.vehicleBooking.confirmDialog.systemDisableMessage'
        ),
      },
      require_vehicle_booking_approval: {
        enable: t(
          'settings.vehicleBooking.confirmDialog.approvalEnableMessage'
        ),
        disable: t(
          'settings.vehicleBooking.confirmDialog.approvalDisableMessage'
        ),
      },
      allow_vehicle_booking_override: {
        enable: t(
          'settings.vehicleBooking.confirmDialog.overrideEnableMessage'
        ),
        disable: t(
          'settings.vehicleBooking.confirmDialog.overrideDisableMessage'
        ),
      },
    };

    const action = value
      ? t('settings.vehicleBooking.confirmDialog.enableAction')
      : t('settings.vehicleBooking.confirmDialog.disableAction');
    const title = `${action} ${settingNames[setting]}?`;
    const message =
      messages[setting]?.[value ? 'enable' : 'disable'] ||
      t('settings.vehicleBooking.confirmDialog.defaultMessage');

    return {title, message};
  };

  // Handler for showing confirmation dialog
  const handleSwitchChangeWithConfirmation = (
    setting:
      | 'vehicle_booking_enabled'
      | 'require_vehicle_booking_approval'
      | 'allow_vehicle_booking_override',
    newValue: boolean
  ) => {
    const {title, message} = getConfirmationContent(setting, newValue);

    setConfirmDialog({
      open: true,
      title,
      message,
      setting,
      value: newValue,
    });
  };

  // Confirm the change
  const confirmChange = async () => {
    if (confirmDialog) {
      setConfirmDialog(null);
      await handleToggleSetting(confirmDialog.setting, confirmDialog.value);
    }
  };

  // Cancel the change
  const cancelChange = () => {
    setConfirmDialog(null);
  };

  const calculateTons = (boxes: number): number => {
    return parseFloat(((boxes * defaultBoxWeight) / 1000).toFixed(2));
  };

  const handleUpdateLimit = async () => {
    if (boxLimit < 1) {
      toast.error(t('settings.validation.boxLimitMin'));
      return;
    }

    try {
      setIsLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const calculatedTons = calculateTons(boxLimit);

      await api.post('/fish-purchase-vehicles/daily-limit', {
        date: today,
        box_limit: boxLimit,
        ton_limit: calculatedTons,
        allow_override: true,
      });

      toast.success(t('settings.dailyLimit.updateSuccess'));
      setShowLimitDialog(false);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update daily limit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (
    settingName:
      | 'vehicle_booking_enabled'
      | 'require_vehicle_booking_approval'
      | 'allow_vehicle_booking_override',
    newValue: boolean
  ) => {
    setIsUpdatingSettings(settingName);

    const updateData = {
      [settingName]: newValue,
    };

    updateControlSettings.mutate(updateData, {
      onSuccess: () => {
        // Update local state for immediate UI feedback
        if (settingName === 'vehicle_booking_enabled') {
          setVehicleBookingEnabled(newValue);
          toast.success(
            newValue
              ? t('settings.vehicleBooking.systemEnabledSuccess')
              : t('settings.vehicleBooking.systemDisabledSuccess')
          );
        } else if (settingName === 'require_vehicle_booking_approval') {
          setRequireApproval(newValue);
          toast.success(
            newValue
              ? t('settings.vehicleBooking.approvalEnabledSuccess')
              : t('settings.vehicleBooking.approvalDisabledSuccess')
          );
        } else if (settingName === 'allow_vehicle_booking_override') {
          setAllowOverride(newValue);
          toast.success(
            newValue
              ? t('settings.vehicleBooking.overrideEnabledSuccess')
              : t('settings.vehicleBooking.overrideDisabledSuccess')
          );
        }
      },
      onError: (error) => {
        console.error(`Failed to update ${settingName}:`, error);
        toast.error(t('settings.vehicleBooking.updateError'));
      },
      onSettled: () => {
        setIsUpdatingSettings(null);
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Settings2 className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('settings.title')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="bg-card divide-y rounded-lg border">
          {/* Daily Limit Menu Item */}
          <button
            onClick={() => setShowLimitDialog(true)}
            className="hover:bg-accent flex w-full items-center justify-between px-4 py-4 transition-colors"
            disabled={isFetching}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-start">
                <div className="font-medium">
                  {t('settings.dailyLimit.title')}
                </div>
                {isFetching ? (
                  <div className="text-muted-foreground text-sm">
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    {calculateTons(boxLimit).toLocaleString()}{' '}
                    {t('vehicleBookings.newBookingForm.tons')} (
                    {boxLimit.toLocaleString()}{' '}
                    {t('vehicleBookings.capacity.boxes')})
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          </button>

          {/* Vehicle Booking System Toggle */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Power className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 text-start">
                <div className="font-medium">
                  {t('settings.vehicleBooking.systemToggle')}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('settings.vehicleBooking.systemToggleDescription')}
                </div>
              </div>
            </div>
            <Switch
              checked={vehicleBookingEnabled}
              onCheckedChange={(checked: boolean) =>
                handleSwitchChangeWithConfirmation(
                  'vehicle_booking_enabled',
                  checked
                )
              }
              disabled={
                isUpdatingSettings === 'vehicle_booking_enabled' || isFetching
              }
            />
          </div>

          {/* Approval Requirement Toggle */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 text-start">
                <div className="font-medium">
                  {t('settings.vehicleBooking.approvalToggle')}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('settings.vehicleBooking.approvalToggleDescription')}
                </div>
              </div>
            </div>
            <Switch
              checked={requireApproval}
              onCheckedChange={(checked: boolean) =>
                handleSwitchChangeWithConfirmation(
                  'require_vehicle_booking_approval',
                  checked
                )
              }
              disabled={
                isUpdatingSettings === 'require_vehicle_booking_approval' ||
                isFetching
              }
            />
          </div>

          {/* Override Capability Toggle */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 text-start">
                <div className="font-medium">
                  {t('settings.vehicleBooking.overrideToggle')}
                </div>
                <div className="text-muted-foreground text-sm">
                  {t('settings.vehicleBooking.overrideToggleDescription')}
                </div>
              </div>
            </div>
            <Switch
              checked={allowOverride}
              onCheckedChange={(checked: boolean) =>
                handleSwitchChangeWithConfirmation(
                  'allow_vehicle_booking_override',
                  checked
                )
              }
              disabled={
                isUpdatingSettings === 'allow_vehicle_booking_override' ||
                isFetching
              }
            />
          </div>
        </div>
      </div>

      {/* Update Limit Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t('settings.dailyLimit.updateButton')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.dailyLimit.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Box Limit Input */}
            <div className="space-y-2">
              <Label htmlFor="box-limit" className="text-sm font-medium">
                {t('settings.dailyLimit.boxLimit')}
              </Label>
              <div className="relative">
                <Input
                  id="box-limit"
                  type="number"
                  value={boxLimit || ''}
                  onChange={(e) => setBoxLimit(parseInt(e.target.value) || 0)}
                  placeholder={t('settings.dailyLimit.boxLimitPlaceholder')}
                  className="h-12 pe-16 text-lg"
                  disabled={isLoading}
                  min={1}
                  max={50000}
                  autoFocus
                />
                <div className="text-muted-foreground absolute end-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                  {t('vehicleBookings.capacity.boxes')}
                </div>
              </div>
              {boxLimit > 0 && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {calculateTons(boxLimit).toLocaleString()}{' '}
                  {t('vehicleBookings.newBookingForm.tons')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLimitDialog(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateLimit}
              disabled={isLoading || boxLimit < 1}
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('settings.dailyLimit.updating')}
                </>
              ) : (
                t('settings.dailyLimit.updateButton')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog?.open || false}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelChange}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmChange}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
