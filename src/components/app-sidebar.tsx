"use client"

import * as React from "react"
import {
  Home,
  Calendar,
  Settings,
  Box,
} from "lucide-react"
import { Link, usePathname } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { isRTL } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Menu items matching mobile nav
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
    key: "more",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')
  const sidebarSide = isRTL(locale) ? "right" : "left"

  return (
    <Sidebar collapsible="icon" side={sidebarSide}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="group">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
                  <img src="/icon-192x192.png" alt="FinsERP Logo" className="size-6 rounded" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">FinsERP</span>
                  <span className="text-xs text-muted-foreground">Mobile App</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      tooltip={t(item.key)}
                      isActive={isActive}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
