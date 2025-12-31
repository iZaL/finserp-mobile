'use client';

import {useIsFetching} from '@tanstack/react-query';
import {RefreshCw} from 'lucide-react';
import {useEffect, useState} from 'react';

/**
 * Global indicator showing when React Query is fetching data in the background
 * Shows a subtle pulsing icon in the top-right when data is being refreshed
 *
 * This helps users understand that the app is actively syncing data
 * even when they don't explicitly trigger a refresh
 */
export function RefetchIndicator() {
  const isFetching = useIsFetching();
  const [show, setShow] = useState(false);

  // Only show if fetching for more than 300ms (prevents flashing for quick requests)
  useEffect(() => {
    if (isFetching > 0) {
      const timer = setTimeout(() => setShow(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isFetching]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[9999]"
      role="status"
      aria-live="polite"
      aria-label="Syncing data"
    >
      <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 backdrop-blur-sm dark:border-blue-400/20 dark:bg-blue-400/10">
        <RefreshCw className="size-4 animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          Syncing...
        </span>
      </div>
    </div>
  );
}
