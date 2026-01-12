'use client';

import * as React from 'react';
import {Link, usePathname} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {Home, Calendar, Factory, Settings} from 'lucide-react';
import {cn} from '@/lib/utils';

const navItems = [
  {
    key: 'home',
    href: '/',
    icon: Home,
  },
  {
    key: 'bookings',
    href: '/vehicle-bookings',
    icon: Calendar,
  },
  {
    key: 'production',
    href: '/production-hub',
    icon: Factory,
  },
  {
    key: 'more',
    href: '/settings',
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  return (
    <nav
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed start-0 end-0 z-50 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-xl md:hidden dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
      style={{bottom: 'env(safe-area-inset-bottom, 0)'}}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:bg-accent/50'
              )}
            >
              {isActive && (
                <div className="bg-primary/10 dark:bg-primary/20 absolute inset-0 rounded-xl transition-all" />
              )}
              <item.icon
                className={cn(
                  'relative z-10 size-6 transition-all',
                  isActive &&
                    'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  'relative z-10 text-[10px] transition-all',
                  isActive && 'font-bold'
                )}
              >
                {t(item.key)}
              </span>
              {isActive && (
                <div className="bg-primary absolute -top-[1px] left-1/2 h-1 w-12 -translate-x-1/2 rounded-b-full shadow-[0_2px_8px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for devices with notches */}
      <div className="safe-bottom" />
    </nav>
  );
}
