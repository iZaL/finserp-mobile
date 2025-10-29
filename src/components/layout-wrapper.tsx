"use client"

import { usePathname } from "@/i18n/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useTranslations } from "next-intl"

const publicRoutes = ["/login", "/register", "/forgot-password"]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)
  const t = useTranslations("layout")

  // For public routes, render children without header
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For authenticated routes, render with sidebar (desktop) and mobile nav
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-40">
          <div className="flex flex-1 items-center gap-2">
            <SidebarTrigger className="-ms-1 md:flex hidden" />
            <Separator orientation="vertical" className="me-2 h-6 md:flex hidden" />
            <h1 className="text-sm font-semibold md:hidden">{t("appName")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-3 p-3 pb-[calc(5rem+env(safe-area-inset-bottom,0))] md:pb-6 md:gap-6 md:p-6">
          {children}
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
