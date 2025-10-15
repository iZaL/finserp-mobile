"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useLanguageStore } from "@/lib/i18n/language-store"

const publicRoutes = ["/login"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { language, setLanguage, dir } = useLanguageStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize language on mount
    const savedLang = localStorage.getItem('language-storage')
    if (savedLang) {
      try {
        const parsed = JSON.parse(savedLang)
        if (parsed.state?.language) {
          setLanguage(parsed.state.language)
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check authentication
    checkAuth().finally(() => {
      setIsInitialized(true)
    })
  }, [checkAuth, setLanguage])

  useEffect(() => {
    if (!isInitialized || isLoading) return

    const isPublicRoute = publicRoutes.includes(pathname)

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login")
    } else if (isAuthenticated && pathname === "/login") {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, pathname, router, isInitialized])

  // Show loading during initial auth check
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
