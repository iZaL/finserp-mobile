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
          title={t("notifications.disable", { defaultMessage: "Disable Notifications" })}
          className="w-8 px-0 md:w-auto md:px-3"
        >
          <BellOff className="h-4 w-4 md:mr-0" />
          <span className="hidden md:inline">
            {t("notifications.disable", { defaultMessage: "Disable" })}
          </span>
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={subscribe}
          disabled={isLoading}
          title={t("notifications.enable", { defaultMessage: "Enable Notifications" })}
          className="w-8 px-0 md:w-auto md:px-3"
        >
          <Bell className="h-4 w-4 md:mr-0" />
          <span className="hidden md:inline">
            {t("notifications.enable", { defaultMessage: "Enable" })}
          </span>
        </Button>
      )}
    </div>
  );
}
