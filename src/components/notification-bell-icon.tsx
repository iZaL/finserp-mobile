'use client';

import {useTranslations} from 'next-intl';
import {Bell, BellOff, Settings} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {usePushNotification} from '@/hooks/use-push-notification';
import {useRouter} from '@/i18n/navigation';
import {toast} from 'sonner';

export function NotificationBellIcon() {
  const t = useTranslations('notifications.header');
  const tWelcome = useTranslations('notifications.welcome');
  const {subscribe, unsubscribe, isSupported, isSubscribed} =
    usePushNotification();
  const router = useRouter();

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error(tWelcome('notSupported'));
      return;
    }

    try {
      if (isSubscribed) {
        await unsubscribe();
        localStorage.removeItem('notification-enabled');
      } else {
        await subscribe();
        localStorage.setItem('notification-enabled', 'true');
        localStorage.setItem('notification-modal-seen', 'true');
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      if (error instanceof Error && error.message.includes('denied')) {
        toast.error(tWelcome('permissionDenied'));
      }
    }
  };

  const handleGoToPreferences = () => {
    router.push('/profile');
  };

  if (!isSupported) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={isSubscribed ? t('clickToManage') : t('clickToEnable')}
        >
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <>
              <BellOff className="text-muted-foreground h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">
          {isSubscribed ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Bell className="h-4 w-4" />
              {t('enabled')}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              {t('disabled')}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggle}>
          {isSubscribed ? (
            <>
              <BellOff className="mr-2 h-4 w-4" />
              {t('disable')}
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              {t('enable')}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGoToPreferences}>
          <Settings className="mr-2 h-4 w-4" />
          {t('goToPreferences')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
