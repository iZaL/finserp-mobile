'use client';

import {useEffect, useRef} from 'react';

/**
 * Service Worker Registration Component
 * Registers the service worker for push notifications and offline support
 * Compatible with Next.js 15
 *
 * Features:
 * - Automatic force updates when new version is available
 * - Proactive update checking on visibility change
 * - Periodic update checks every 30 minutes
 */
export function ServiceWorkerRegister() {
  const updateCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let registration: ServiceWorkerRegistration;

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
        })
        .then((reg) => {
          registration = reg;
          console.log(
            'Service Worker registered successfully:',
            registration.scope
          );

          // Check for updates immediately
          registration.update();

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log(
                    'New service worker available, forcing update...'
                  );
                  // Send message to skip waiting immediately
                  newWorker.postMessage({type: 'SKIP_WAITING'});
                }
              });
            }
          });

          // Set up periodic update checks (every 30 minutes)
          updateCheckIntervalRef.current = setInterval(
            () => {
              console.log('Checking for service worker updates...');
              registration.update();
            },
            30 * 60 * 1000
          ); // 30 minutes

          // Check for updates when page becomes visible
          const handleVisibilityChange = () => {
            if (!document.hidden) {
              console.log('Page visible, checking for updates...');
              registration.update();
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Check for updates when page gains focus
          const handleFocus = () => {
            console.log('Page focused, checking for updates...');
            registration.update();
          };

          window.addEventListener('focus', handleFocus);

          // Cleanup listeners on unmount
          return () => {
            document.removeEventListener(
              'visibilitychange',
              handleVisibilityChange
            );
            window.removeEventListener('focus', handleFocus);
          };
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });

      // Handle controller change (when service worker is updated)
      // This is where we automatically reload the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker updated, reloading page...');
        // Reload the page to use the new service worker
        window.location.reload();
      });

      // Cleanup interval on unmount
      return () => {
        if (updateCheckIntervalRef.current) {
          clearInterval(updateCheckIntervalRef.current);
        }
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
