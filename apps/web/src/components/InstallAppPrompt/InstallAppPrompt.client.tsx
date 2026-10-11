"use client";
import "client-only";

import { Alert, AlertDescription, AlertTitle } from "@nfl-pool-monorepo/ui/components/alert";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { type FC, useEffect, useState } from "react";
import { LuDownload, LuX } from "react-icons/lu";

const DISMISSED_KEY = "nfl-install-dismissed";
const DISMISS_DAYS = 30;

// Chromium's install prompt event; not part of the standard DOM typings
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallEnvironment = {
  isDismissed: boolean;
  isIOS: boolean;
  isStandalone: boolean;
};

const readEnvironment = (): InstallEnvironment => {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY));

  return {
    isDismissed: dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches,
  };
};

const isPromptable = (environment: InstallEnvironment, hasInstallEvent: boolean): boolean =>
  !environment.isStandalone && !environment.isDismissed && (hasInstallEvent || environment.isIOS);

const useInstallEnvironment = (): { dismiss: () => void; environment: InstallEnvironment | null } => {
  const [environment, setEnvironment] = useState<InstallEnvironment | null>(null);

  // react-doctor-disable-next-line react-doctor/rendering-hydration-no-flicker -- install/standalone detection needs window and navigator, only available after mount
  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- same reason
    setEnvironment(readEnvironment());
  }, []);

  const dismiss = (): void => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setEnvironment((current) => (current ? { ...current, isDismissed: true } : current));
  };

  return { dismiss, environment };
};

const useInstallEvent = (): { install: () => Promise<void>; installEvent: BeforeInstallPromptEvent | null } => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async (): Promise<void> => {
    await installEvent?.prompt();
    await installEvent?.userChoice;
    setInstallEvent(null);
  };

  return { install, installEvent };
};

type InstallCardProps = {
  canInstall: boolean;
  onDismiss: () => void;
  onInstall: () => void;
};

const InstallCard: FC<InstallCardProps> = ({ canInstall, onDismiss, onInstall }) => (
  <Alert className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex items-start gap-3 shadow-lg md:static md:inset-auto md:z-auto md:mb-3 md:shadow-none">
    <LuDownload aria-hidden="true" />
    <div className="flex-1">
      <AlertTitle>Install the app</AlertTitle>
      <AlertDescription>
        {canInstall
          ? "Get faster loading, offline access to your picks and standings, and notifications."
          : 'Tap the Share button, then "Add to Home Screen" for faster loading, offline access, and notifications.'}
      </AlertDescription>
      {canInstall ? (
        <Button className="mt-2" onClick={onInstall} size="sm" type="button" variant="primary">
          Install
        </Button>
      ) : null}
    </div>
    <Button aria-label="Dismiss install prompt" onClick={onDismiss} size="icon" type="button" variant="ghost">
      <LuX aria-hidden="true" />
    </Button>
  </Alert>
);

// Invites people to install the app: the native prompt where the browser offers one, steps on iOS. A banner in the
// thumb zone on phones (where iOS Share and Chrome's own install prompt also live), an inline card on desktop.
const InstallAppPrompt: FC = () => {
  const { dismiss, environment } = useInstallEnvironment();
  const { install, installEvent } = useInstallEvent();

  if (!environment || !isPromptable(environment, installEvent !== null)) {
    return null;
  }

  return <InstallCard canInstall={installEvent !== null} onDismiss={dismiss} onInstall={install} />;
};

export default InstallAppPrompt;
