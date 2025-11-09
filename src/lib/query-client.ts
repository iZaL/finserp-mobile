import { QueryClient } from "@tanstack/react-query"

/**
 * QueryClient configuration with offline-first settings
 * - Long staleTime for offline support
 * - Aggressive caching for better performance
 * - Retry logic optimized for network issues
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 24 hours
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)
      // Retry failed requests up to 3 times
      retry: 3,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
      // Network mode: prefer cache, fallback to network
      networkMode: "offlineFirst",
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode: prefer online, but allow offline queuing
      networkMode: "online",
    },
  },
})

