"use client"

import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Prefetch common data after component mounts
  // This warms up the cache for better perceived performance
  // COMMENTED OUT: Disable prefetching to reduce initial API calls
  // Can be re-enabled later if needed for performance optimization
  useEffect(() => {
    // Small delay to not interfere with initial page load
    const timer = setTimeout(() => {
      // prefetchCommonData(queryClient)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

