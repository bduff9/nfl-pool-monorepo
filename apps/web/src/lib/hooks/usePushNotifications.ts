import { useEffect, useState } from "react";
import { toast } from "sonner";

import { env } from "@/lib/env.client";
import { urlBase64ToUint8Array } from "@/lib/strings";
import { subscribeUser, unsubscribeUser } from "@/server/actions/device";

type UsePushNotificationsResult = {
  isSupported: boolean | null;
  subscribeToPush: () => Promise<void>;
  subscription: PushSubscription | null;
  unsubscribeFromPush: () => Promise<void>;
};

export const usePushNotifications = (): UsePushNotificationsResult => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const registerServiceWorker = async (): Promise<void> => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const sub = await registration.pushManager.getSubscription();

        setSubscription(sub);
      } catch (error) {
        console.error("Failed to register service worker", error);
      }
    };

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setIsSupported(false);
    }
  }, []);

  const subscribeToPush = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      // react-doctor-disable-next-line effect-needs-cleanup -- one-shot subscription from a user action, not an effect; the browser owns its lifetime
      const sub = await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        userVisibleOnly: true,
      });

      setSubscription(sub);

      await subscribeUser({ agent: navigator.userAgent, subscription: JSON.stringify(sub) });
    } catch (error) {
      console.error("Failed to enable push notifications", error);
      toast.error("Couldn't enable push notifications", { description: "Please try again." });
    }
  };

  const unsubscribeFromPush = async (): Promise<void> => {
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      await unsubscribeUser({ agent: navigator.userAgent, subscription: JSON.stringify(subscription) });
    } catch (error) {
      console.error("Failed to disable push notifications", error);
      toast.error("Couldn't disable push notifications", { description: "Please try again." });
    }
  };

  return { isSupported, subscribeToPush, subscription, unsubscribeFromPush };
};
