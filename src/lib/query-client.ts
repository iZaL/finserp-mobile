import { QueryClient } from "@tanstack/react-query"

/**
 * QueryClient configuration optimized for real-time mobile PWA with offline support
 *
 * Key optimizations:
 * - SHORT staleTime (0) - Data refetches on mount for real-time updates
 * - Aggressive gcTime (24 hrs) - Keeps data cached for offline use and instant navigation
 * - Smart retry logic - Handles network issues gracefully
 * - offlineFirst mode - App works seamlessly offline
 * - Background refetching - Keeps data fresh without blocking UI
 *
 * Strategy:
 * - Show cached data INSTANTLY on navigation (gcTime keeps it available)
 * - Refetch in BACKGROUND to get latest data (staleTime: 0 means always refetch)
 * - User sees old data immediately, then it updates seamlessly in background
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is ALWAYS considered stale (0ms)
      // This means we ALWAYS refetch in the background to get latest data
      // BUT we still show cached data immediately while refetching
      staleTime: 0, // Always refetch for real-time data

      // Cache data for 24 hours (even when stale)
      // This ensures:
      // 1. Instant navigation - show cached data immediately
      // 2. Offline functionality - data available offline
      // 3. Background refetching doesn't block UI
      gcTime: 24 * 60 * 60 * 1000, // 24 hours (formerly cacheTime)

      // Retry failed requests up to 3 times
      // Handles temporary network issues gracefully
      retry: 3,

      // Retry delay increases exponentially (1s, 2s, 4s, max 30s)
      // Gives network time to recover between retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time updates
      // When user comes back to the app, get fresh data
      refetchOnWindowFocus: true,

      // Refetch when network reconnects
      // Ensures data is fresh after coming back online
      refetchOnReconnect: true,

      // Always refetch on mount (because staleTime is 0)
      // Shows cached data immediately, then refetches in background
      refetchOnMount: true,

      // Network mode: prefer cache, fallback to network
      // Perfect for offline-first PWA experience
      networkMode: "offlineFirst",

      // Enable structural sharing to minimize re-renders
      // React Query will deeply compare objects and only trigger re-renders on actual changes
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure
      // Gives mutations one chance to succeed after network recovery
      retry: 1,

      // Network mode: prefer online, but allow offline queuing
      // Mutations need network, but won't fail immediately if offline
      networkMode: "online",

      // Retry delay for mutations (1 second)
      retryDelay: 1000,
    },
  },
})

