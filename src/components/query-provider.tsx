"use client"

import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { prefetchCommonData } from "@/lib/prefetch-utils"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Prefetch common data after component mounts
  // This warms up the cache for better perceived performance
  useEffect(() => {
    // Small delay to not interfere with initial page load
    const timer = setTimeout(() => {
      prefetchCommonData(queryClient)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

