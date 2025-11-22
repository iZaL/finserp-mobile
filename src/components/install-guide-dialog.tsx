"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share, MoreVertical, Monitor, Smartphone, CheckCircle } from "lucide-react";
import { detectPlatform, type Platform } from "@/lib/platform-detect";
import { useState, useEffect } from "react";

interface InstallGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallGuideDialog({ open, onOpenChange }: InstallGuideDialogProps) {
  const t = useTranslations();
  const [platform, setPlatform] = useState<Platform>("other");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const platformInfo = detectPlatform();
    setPlatform(platformInfo.platform);
    setIsStandalone(platformInfo.isStandalone);
  }, []);

  const renderIOSSteps = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          1
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Share className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.iosSteps.step1")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.iosSteps.step1Detail")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          2
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.iosSteps.step2")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.iosSteps.step2Detail")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          3
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.iosSteps.step3")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.iosSteps.step3Detail")}
          </p>
        </div>
      </div>
    </div>
  );

  const renderAndroidSteps = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          1
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MoreVertical className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.androidSteps.step1")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.androidSteps.step1Detail")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          2
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.androidSteps.step2")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.androidSteps.step2Detail")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          3
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.androidSteps.step3")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.androidSteps.step3Detail")}
          </p>
        </div>
      </div>
    </div>
  );

  const renderDesktopSteps = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          1
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.desktopSteps.step1")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.desktopSteps.step1Detail")}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          2
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("install.guide.desktopSteps.step2")}</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install.guide.desktopSteps.step2Detail")}
          </p>
        </div>
      </div>
    </div>
  );

  const getPlatformTitle = () => {
    switch (platform) {
      case "ios-safari":
        return t("install.guide.iosTitle");
      case "android-chrome":
        return t("install.guide.androidTitle");
      case "desktop":
        return t("install.guide.desktopTitle");
      default:
        return t("install.guide.title");
    }
  };

  const renderSteps = () => {
    switch (platform) {
      case "ios-safari":
        return renderIOSSteps();
      case "android-chrome":
        return renderAndroidSteps();
      case "desktop":
        return renderDesktopSteps();
      default:
        // Show both mobile options for unknown platforms
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">{t("install.guide.iosTitle")}</h3>
              {renderIOSSteps()}
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">{t("install.guide.androidTitle")}</h3>
              {renderAndroidSteps()}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getPlatformTitle()}</DialogTitle>
          <DialogDescription>
            {isStandalone
              ? t("install.guide.alreadyInstalled")
              : t("install.guide.description")}
          </DialogDescription>
        </DialogHeader>

        {!isStandalone && <div className="py-4">{renderSteps()}</div>}

        {isStandalone && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">{t("install.guide.alreadyInstalled")}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>{t("install.guide.close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
