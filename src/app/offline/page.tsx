'use client';

import {useEffect, useState} from 'react';
import {WifiOff, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-muted mx-auto mb-4 flex size-20 items-center justify-center rounded-full">
            <WifiOff className="text-muted-foreground size-10" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
          <CardDescription>
            {isOnline
              ? 'Connection restored! You can reload the page.'
              : "It looks like you've lost your internet connection. Some features may not be available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>While offline, you can still:</p>
            <ul className="ms-4 list-inside list-disc space-y-1">
              <li>View previously loaded content</li>
              <li>Access cached data</li>
              <li>Continue working with saved information</li>
            </ul>
          </div>
          <Button
            onClick={handleRetry}
            className="w-full"
            variant={isOnline ? 'default' : 'outline'}
          >
            <RefreshCw className="me-2 size-4" />
            {isOnline ? 'Reload Page' : 'Check Connection'}
          </Button>
          {isOnline && (
            <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
              ✓ Connection restored
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
