'use client';

import {useState, useEffect, useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Car,
  Plus,
  BarChart3,
  ClipboardList,
  FileText,
  Lock,
  Factory,
  ChevronRight,
} from 'lucide-react';
import {usePermissions} from '@/lib/stores/permission-store';
import {useAuthStore} from '@/lib/stores/auth-store';
import {BookingStatusBanner} from '@/components/booking-status-banner';
import {NotificationWelcomeModal} from '@/components/notification-welcome-modal';
import {NotificationEnableBanner} from '@/components/notification-enable-banner';
import {useVehicleBookingSettings} from '@/hooks/use-vehicle-bookings';
import {usePushNotification} from '@/hooks/use-push-notification';
import {cn} from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Dashboard Action Card Component
interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
  lockTooltip?: string;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  gradient,
  onClick,
  disabled,
  locked,
  lockTooltip,
}: ActionCardProps) {
  const card = (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl bg-gradient-to-br p-4 text-left text-white shadow-md transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md',
        gradient
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-3 -right-3 size-16 rounded-full bg-white/10" />
      <div className="absolute -bottom-2 -left-2 size-12 rounded-full bg-white/5" />

      {/* Lock indicator */}
      {locked && (
        <div className="absolute top-2 right-2 rounded-full bg-white/20 p-1.5">
          <Lock className="size-3.5" />
        </div>
      )}

      <div className="relative">
        <div className="mb-3 inline-flex rounded-lg bg-white/20 p-2.5 backdrop-blur-sm">
          <Icon className="size-5" />
        </div>
        <h4 className="mb-0.5 font-semibold">{title}</h4>
        <p className="text-xs text-white/80">{description}</p>
      </div>

      {/* Hover indicator */}
      <ChevronRight className="absolute right-3 bottom-3 size-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-60" />
    </button>
  );

  if (locked && lockTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent>
            <p>{lockTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return card;
}

// Section Header Component
function SectionHeader({
  icon: Icon,
  title,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  gradient: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md',
          gradient
        )}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tBookingStatus = useTranslations('bookingStatus');
  const permissions = usePermissions();
  const user = useAuthStore((s) => s.user);
  const {data: settings, isLoading: settingsLoading} =
    useVehicleBookingSettings();
  const {isSupported, isSubscribed} = usePushNotification();

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  const isBookingEnabled = settings?.vehicle_booking_enabled ?? true;

  // Check if user has access to any vehicle booking feature
  // Depend on `user` so this recomputes when auth data loads
  const hasVehicleBookingAccess = useMemo(() => {
    return (
      permissions.canAccessVehicleBookings() ||
      permissions.canCreateVehicleBooking() ||
      permissions.canViewVehicleBookingReports() ||
      permissions.canViewBillAttachments()
    );
  }, [permissions, user]);

  // Check if user has access to any production feature
  const hasProductionAccess = useMemo(() => {
    return (
      permissions.canAccessProductionRuns() ||
      permissions.canAccessProductionOutputs() ||
      permissions.canAccessInventory()
    );
  }, [permissions, user]);

  // Debug logging
  useEffect(() => {
    if (!settingsLoading) {
      console.log('Dashboard settings:', {
        settings,
        vehicle_booking_enabled: settings?.vehicle_booking_enabled,
        isBookingEnabled,
        settingsLoading,
      });
    }
  }, [settings, isBookingEnabled, settingsLoading]);

  // Check if we should show notification modal or banner
  useEffect(() => {
    if (!isSupported || isSubscribed) {
      return;
    }

    const hasSeenModal =
      localStorage.getItem('notification-modal-seen') === 'true';

    if (!hasSeenModal) {
      // Show modal if never seen before
      setShowNotificationModal(true);
    } else {
      // Show banner if modal was dismissed but notifications not enabled
      setShowNotificationBanner(true);
    }
  }, [isSupported, isSubscribed]);

  const handleModalDismiss = () => {
    setShowNotificationModal(false);
    setShowNotificationBanner(true);
  };

  return (
    <>
      {/* Notification Welcome Modal */}
      <NotificationWelcomeModal
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
        onDismiss={handleModalDismiss}
      />

      {/* Hero Section */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg">
        {/* Background decoration */}
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 size-16 rounded-full bg-white/5" />

        <div className="relative">
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-1 text-slate-300">{t('welcome')}</p>
        </div>
      </div>

      {/* Notification Enable Banner - Always visible if not subscribed */}
      {showNotificationBanner && <NotificationEnableBanner />}

      {/* Booking Status Banner */}
      {!settingsLoading && <BookingStatusBanner isEnabled={isBookingEnabled} />}

      {/* Vehicle Booking Management Section */}
      {hasVehicleBookingAccess && (
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <SectionHeader
            icon={Car}
            title={t('vehicleBookings')}
            gradient="from-blue-500 to-blue-600"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {permissions.canAccessVehicleBookings() && (
              <ActionCard
                icon={ClipboardList}
                title={t('viewBookings')}
                description={t('manageVehicles')}
                gradient="from-blue-400 to-blue-500"
                onClick={() => router.push('/vehicle-bookings')}
              />
            )}

            {permissions.canCreateVehicleBooking() && (
              <ActionCard
                icon={Plus}
                title={t('newBooking')}
                description={t('addNewBooking')}
                gradient="from-teal-400 to-cyan-500"
                onClick={() => router.push('/vehicle-bookings/new')}
                disabled={!isBookingEnabled}
                locked={!isBookingEnabled}
                lockTooltip={tBookingStatus('closedDescription')}
              />
            )}

            {permissions.canViewVehicleBookingReports() && (
              <ActionCard
                icon={BarChart3}
                title={t('statistics')}
                description={t('viewStatistics')}
                gradient="from-violet-400 to-purple-500"
                onClick={() => router.push('/vehicle-bookings/calendar')}
              />
            )}

            {permissions.canViewBillAttachments() && (
              <ActionCard
                icon={FileText}
                title={t('vehicleBills')}
                description={t('manageBills')}
                gradient="from-amber-400 to-amber-500"
                onClick={() => router.push('/vehicle-bookings/bills')}
              />
            )}
          </div>
        </div>
      )}

      {/* Production Section */}
      {hasProductionAccess && (
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <SectionHeader
            icon={Factory}
            title={t('production')}
            gradient="from-stone-400 to-stone-500"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {permissions.canAccessProductionRuns() && (
              <ActionCard
                icon={Factory}
                title={t('productionHub')}
                description={t('productionHubDesc')}
                gradient="from-emerald-500 to-green-600"
                onClick={() => router.push('/production-hub')}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
