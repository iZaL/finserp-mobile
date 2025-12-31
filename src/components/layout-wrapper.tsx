'use client';

import {usePathname} from '@/i18n/navigation';
import {MobileNav} from '@/components/mobile-nav';
import {UserMenu} from '@/components/user-menu';
import {LanguageSwitcher} from '@/components/language-switcher';
import {ModeToggle} from '@/components/mode-toggle';
import {NotificationBellIcon} from '@/components/notification-bell-icon';
import {AppSidebar} from '@/components/app-sidebar';
import {OfflineIndicator} from '@/components/offline-indicator';
import {ImpersonationBanner} from '@/components/impersonation-banner';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {Separator} from '@/components/ui/separator';
import {useTranslations, useLocale} from 'next-intl';
import Image from 'next/image';

const publicRoutes = ['/login', '/register', '/forgot-password'];

export function LayoutWrapper({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const isPublicRoute = publicRoutes.includes(pathname);
  const t = useTranslations('layout');

  // For public routes, render children without header
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For authenticated routes, render with sidebar (desktop) and mobile nav
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <OfflineIndicator />
        <ImpersonationBanner />
        <header className="bg-background sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div
            className={`flex flex-1 items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <SidebarTrigger className="-ms-1 hidden md:flex" />
            <Separator
              orientation="vertical"
              className="me-2 hidden h-6 md:flex"
            />
            <div className={`flex items-center md:hidden`}>
              <Image
                src="/icon-192x192.png"
                alt={t('appName')}
                width={52}
                height={52}
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBellIcon />
            <ModeToggle />
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-3 p-3 pb-[calc(5rem+env(safe-area-inset-bottom,0))] md:gap-6 md:p-6 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
