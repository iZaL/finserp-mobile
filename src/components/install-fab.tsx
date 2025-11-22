"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { detectPlatform } from "@/lib/platform-detect";
import { InstallGuideDialog } from "@/components/install-guide-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Install FAB (Floating Action Button)
 * Shows a persistent floating button for users who dismissed the install prompt
 * but might want to install later
 */
export function InstallFAB() {
  const t = useTranslations();
  const [showFAB, setShowFAB] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const platformInfo = detectPlatform();

    if (platformInfo.isStandalone) {
      // Don't show FAB if already installed
      return;
    }

    // Check if user has dismissed the install prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    if (dismissed) {
      // Show FAB for users who dismissed the prompt but might want to install later
      setShowFAB(true);
    }
  }, []);

  const handleClick = () => {
    setShowGuide(true);
  };

  if (!showFAB) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              size="icon"
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-6"
              aria-label={t("install.fab.tooltip")}
            >
              <Download className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{t("install.fab.tooltip")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <InstallGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}
