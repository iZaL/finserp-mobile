"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Box, Globe } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('login')
  const { login, isAuthenticated } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)

    try {
      await login(email, password, rememberMe)
      router.push("/")
    } catch (err: unknown) {
      console.error("Login error:", err)
      // Error toast is handled by API interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md overflow-y-auto max-h-full">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <Link href="/login" locale="en">
              <Button
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Globe className="size-4" />
                English
              </Button>
            </Link>
            <Link href="/login" locale="ar">
              <Button
                variant={locale === "ar" ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Globe className="size-4" />
                العربية
              </Button>
            </Link>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg">
              <Box className="size-8" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
              ERP Mobile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("password")}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t("password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t("rememberMe")}</span>
              </label>

              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? t("loggingIn") : t("loginButton")}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-center text-blue-700 dark:text-blue-300 font-medium">
              {t("demoCredentials")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
