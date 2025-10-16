"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration Component
 * Registers the service worker for push notifications and offline support
 * Compatible with Next.js 15
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration.scope);

          // Check for updates periodically
          registration.update();

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("New service worker available, reload to update");
                  // You could show a toast notification here to let user know about the update
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Message from service worker:", event.data);
      });

      // Handle controller change (when service worker is updated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service worker controller changed");
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
