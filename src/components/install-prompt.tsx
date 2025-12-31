'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {X, Download, HelpCircle} from 'lucide-react';
import {detectPlatform} from '@/lib/platform-detect';
import {InstallGuideDialog} from '@/components/install-guide-dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

/**
 * Install Prompt Component
 * Shows a prompt to install the PWA when the browser's install criteria are met
 * Hides automatically when the app is already running in standalone mode
 */
export function InstallPrompt() {
  const t = useTranslations();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect platform
    const platformInfo = detectPlatform();
    setIsStandalone(platformInfo.isStandalone);
    setIsIOS(platformInfo.platform === 'ios-safari');

    if (platformInfo.isStandalone) {
      // Don't show install prompt if already installed
      return;
    }

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed =
      (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);

    // For iOS, show the guide button since beforeinstallprompt doesn't work
    if (platformInfo.platform === 'ios-safari') {
      // Show prompt if never dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setShowPrompt(true);
      }
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt if never dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // For iOS, just open the guide
    if (isIOS) {
      setShowGuide(true);
      return;
    }

    if (!deferredPrompt) {
      setShowGuide(true);
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const {outcome} = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'dismissed') {
      // Remember that user dismissed the prompt
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleOpenGuide = () => {
    setShowGuide(true);
  };

  // Don't show anything if in standalone mode or prompt shouldn't be shown
  if (isStandalone || !showPrompt) {
    return null;
  }

  // Don't show on iOS if there's no prompt (will show guide button instead)
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <div className="animate-in slide-in-from-bottom-5 fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:max-w-sm">
        <div className="bg-card border-border rounded-lg border p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Download className="text-primary h-5 w-5" />
                <h3 className="text-sm font-semibold">
                  {t('install.prompt.title')}
                </h3>
              </div>
              <p className="text-muted-foreground mb-3 text-xs">
                {t('install.prompt.description')}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1"
                >
                  {isIOS
                    ? t('install.prompt.openGuide')
                    : t('install.prompt.install')}
                </Button>
                {!isIOS && (
                  <Button onClick={handleOpenGuide} variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={handleDismiss} variant="outline" size="sm">
                  {t('install.prompt.notNow')}
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <InstallGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}
