"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  TruckIcon,
  PackageCheck,
  PackageX,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { usePushNotification } from "@/hooks/use-push-notification";
import { toast } from "sonner";

interface NotificationWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export function NotificationWelcomeModal({
  open,
  onOpenChange,
  onDismiss,
}: NotificationWelcomeModalProps) {
  const t = useTranslations("notifications.welcome");
  const { subscribe, isSupported, isSubscribed } = usePushNotification();

  const handleEnable = async () => {
    if (!isSupported) {
      toast.error(t("notSupported"));
      return;
    }

    try {
      await subscribe();
      onOpenChange(false);
      // Mark as seen and enabled
      localStorage.setItem("notification-modal-seen", "true");
      localStorage.setItem("notification-enabled", "true");
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      if (error instanceof Error && error.message.includes("denied")) {
        toast.error(t("permissionDenied"));
      }
    }
  };

  const handleMaybeLater = () => {
    onOpenChange(false);
    onDismiss();
    // Mark as seen but not enabled
    localStorage.setItem("notification-modal-seen", "true");
  };

  const benefits = [
    { icon: TruckIcon, text: t("benefits.bookingCreated"), color: "text-blue-600 dark:text-blue-400" },
    { icon: PackageCheck, text: t("benefits.bookingReceived"), color: "text-green-600 dark:text-green-400" },
    { icon: PackageX, text: t("benefits.offloadingStarted"), color: "text-orange-600 dark:text-orange-400" },
    { icon: CheckCircle2, text: t("benefits.offloadingCompleted"), color: "text-emerald-600 dark:text-emerald-400" },
    { icon: LogOut, text: t("benefits.vehicleExited"), color: "text-purple-600 dark:text-purple-400" },
    { icon: CheckCircle2, text: t("benefits.bookingApproved"), color: "text-teal-600 dark:text-teal-400" },
    { icon: AlertTriangle, text: t("benefits.systemAlerts"), color: "text-yellow-600 dark:text-yellow-400" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          {/* Animated Bell Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full">
              <Bell className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("subtitle")}
            </p>
          </div>

          {/* Benefits List */}
          <div className="w-full bg-muted/30 rounded-lg p-4 space-y-3">
            <p className="font-semibold text-sm text-start">
              {t("benefits.title")}
            </p>
            <div className="grid gap-2">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-start text-sm"
                >
                  <benefit.icon className={`h-4 w-4 flex-shrink-0 ${benefit.color}`} />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-2">
            <Button
              onClick={handleEnable}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
              disabled={!isSupported || isSubscribed}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t("enableButton")}
            </Button>
            <Button
              onClick={handleMaybeLater}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              {t("maybeLater")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
