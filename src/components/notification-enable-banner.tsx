"use client";

import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { usePushNotification } from "@/hooks/use-push-notification";
import { toast } from "sonner";

interface NotificationEnableBannerProps {
  className?: string;
}

export function NotificationEnableBanner({ className }: NotificationEnableBannerProps) {
  const t = useTranslations("notifications.banner");
  const tWelcome = useTranslations("notifications.welcome");
  const { subscribe, isSupported, isSubscribed } = usePushNotification();

  const handleEnable = async () => {
    if (!isSupported) {
      toast.error(tWelcome("notSupported"));
      return;
    }

    try {
      await subscribe();
      localStorage.setItem("notification-enabled", "true");
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      if (error instanceof Error && error.message.includes("denied")) {
        toast.error(tWelcome("permissionDenied"));
      }
    }
  };

  // Don't show if already subscribed or not supported
  if (!isSupported || isSubscribed) {
    return null;
  }

  return (
    <Alert
      className={cn(
        "animate-in slide-in-from-top-2",
        "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20",
        "border-blue-200 dark:border-blue-800 border-2",
        "py-2",
        className
      )}
    >
      <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <div className="flex items-center justify-between gap-3 flex-1">
        <AlertDescription className="text-blue-900 dark:text-blue-100 text-xs m-0">
          {t("message")}
        </AlertDescription>
        <Button
          onClick={handleEnable}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 h-7 text-xs flex-shrink-0"
        >
          {t("enableNow")}
        </Button>
      </div>
    </Alert>
  );
}
