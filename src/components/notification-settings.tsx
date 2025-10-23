"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePushNotification } from "@/hooks/use-push-notification";
import { useTranslations } from "next-intl";

export function NotificationSettings() {
  const t = useTranslations();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotification();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  const handleDisableClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDisable = () => {
    unsubscribe();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisableClick}
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("notifications.disableConfirm.title", { defaultMessage: "Disable Notifications?" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("notifications.disableConfirm.description", {
                defaultMessage: "You will no longer receive push notifications for vehicle bookings. You can re-enable them at any time."
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", { defaultMessage: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable}>
              {t("notifications.disableConfirm.confirm", { defaultMessage: "Disable" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
