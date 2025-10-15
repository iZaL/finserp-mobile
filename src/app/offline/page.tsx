"use client"

import { useEffect, useState } from "react"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-20 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="size-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
          <CardDescription>
            {isOnline
              ? "Connection restored! You can reload the page."
              : "It looks like you've lost your internet connection. Some features may not be available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>While offline, you can still:</p>
            <ul className="list-disc list-inside space-y-1 ms-4">
              <li>View previously loaded content</li>
              <li>Access cached data</li>
              <li>Continue working with saved information</li>
            </ul>
          </div>
          <Button
            onClick={handleRetry}
            className="w-full"
            variant={isOnline ? "default" : "outline"}
          >
            <RefreshCw className="size-4 me-2" />
            {isOnline ? "Reload Page" : "Check Connection"}
          </Button>
          {isOnline && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400">
              ✓ Connection restored
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
