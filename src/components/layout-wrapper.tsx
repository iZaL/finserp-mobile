"use client"

import { usePathname } from "@/i18n/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/user-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const publicRoutes = ["/login", "/register", "/forgot-password"]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)

  // For public routes, render children without sidebar/header
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For authenticated routes, render with sidebar/header
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-40">
          <SidebarTrigger className="-ms-1 md:flex hidden" />
          <Separator orientation="vertical" className="me-2 h-6 md:flex hidden" />
          <div className="flex flex-1 items-center justify-between gap-2">
            <h1 className="text-sm font-semibold">ERP Mobile</h1>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageSwitcher />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pb-20 md:pb-6 md:gap-6 md:p-6">
          {children}
        </main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  )
}
