import { useState, useEffect, useCallback } from "react";
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendSubscriptionToBackend,
  removeSubscriptionFromBackend,
  hasNotificationPermission,
  isPushNotificationSupported,
} from "@/lib/services/push-notification";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check support and permission on mount
  useEffect(() => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported && "Notification" in window) {
      setPermission(Notification.permission);

      // Check if already subscribed
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Failed to check subscription status:", error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is not configured");
      toast.error("Push notifications are not configured");
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission denied");
        return false;
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);

      if (!subscription) {
        toast.error("Failed to subscribe to notifications");
        return false;
      }

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription, VAPID_PUBLIC_KEY);

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
      return true;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error("Failed to enable push notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from backend first
        await removeSubscriptionFromBackend(subscription.endpoint);
      }

      // Unsubscribe locally
      const success = await unsubscribeFromPushNotifications();

      if (success) {
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      toast.error("Failed to disable push notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    hasPermission: hasNotificationPermission(),
    subscribe,
    unsubscribe,
  };
}
