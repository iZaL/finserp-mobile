'use client';

import {useNetworkStatus} from '@/hooks/use-network-status';
import {WifiOff, Wifi, CheckCircle2, Clock} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useEffect, useState} from 'react';

export function OfflineIndicator() {
  const {isOnline, wasOffline, queueCount} = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline || wasOffline || queueCount > 0) {
      setShow(true);
    } else {
      // Hide after a delay when online and no queue
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, queueCount]);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed top-14 right-0 left-0 z-50 px-4 py-2 text-sm font-medium transition-all duration-300',
        isOnline
          ? wasOffline
            ? 'bg-emerald-500/90 text-white'
            : queueCount > 0
              ? 'bg-amber-500/90 text-white'
              : 'bg-emerald-500/90 text-white'
          : 'bg-red-500/90 text-white'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="size-4" />
            <span>
              You&apos;re offline. Changes will be synced when connection is
              restored.
            </span>
          </>
        ) : wasOffline ? (
          <>
            <CheckCircle2 className="size-4" />
            <span>Connection restored! Syncing changes...</span>
          </>
        ) : queueCount > 0 ? (
          <>
            <Clock className="size-4" />
            <span>
              {queueCount} {queueCount === 1 ? 'change' : 'changes'} pending
              sync...
            </span>
          </>
        ) : (
          <>
            <Wifi className="size-4" />
            <span>All changes synced</span>
          </>
        )}
      </div>
    </div>
  );
}
