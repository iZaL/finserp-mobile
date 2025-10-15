"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotification } from "@/hooks/use-push-notification";
import { useTranslations } from "next-intl";

export function NotificationSettings() {
  const t = useTranslations();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotification();

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribe}
          disabled={isLoading}
          className="gap-2"
        >
          <BellOff className="h-4 w-4" />
          {t("notifications.disable", { defaultMessage: "Disable Notifications" })}
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={subscribe}
          disabled={isLoading}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          {t("notifications.enable", { defaultMessage: "Enable Notifications" })}
        </Button>
      )}
    </div>
  );
}
