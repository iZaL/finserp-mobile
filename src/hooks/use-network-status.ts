"use client"

import { useState, useEffect } from "react"
import { offlineQueueService } from "@/lib/offline-queue"

export interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean // True if we just came back online
  queueCount: number
}

/**
 * Hook to monitor network status and offline queue
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== "undefined" ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setWasOffline(true)
      setIsOnline(true)
      // Reset wasOffline after a short delay
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Subscribe to queue count changes
    const unsubscribe = offlineQueueService.subscribe((count) => {
      setQueueCount(count)
    })

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      unsubscribe()
    }
  }, [])

  return {
    isOnline,
    wasOffline,
    queueCount,
  }
}

