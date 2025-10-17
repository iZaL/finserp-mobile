"use client"

import * as React from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  Home,
  Calendar,
  Users,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    key: "home",
    href: "/",
    icon: Home,
  },
  {
    key: "bookings",
    href: "/vehicle-bookings",
    icon: Calendar,
  },
  {
    key: "suppliers",
    href: "/suppliers",
    icon: Users,
  },
  {
    key: "more",
    href: "/settings",
    icon: Settings,
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-95 min-w-[68px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent/50"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl transition-all" />
              )}
              <item.icon
                className={cn(
                  "size-6 transition-all relative z-10",
                  isActive && "scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "transition-all relative z-10 text-[10px]",
                  isActive && "font-bold"
                )}
              >
                {t(item.key)}
              </span>
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer for devices with notches */}
      <div className="safe-bottom" />
    </nav>
  )
}
