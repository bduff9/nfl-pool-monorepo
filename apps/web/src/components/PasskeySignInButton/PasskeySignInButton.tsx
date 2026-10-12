"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import "client-only";

import { useRouter } from "next/navigation";
import { type FC, useSyncExternalStore, useTransition } from "react";
import { PiFingerprintDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { getPostLoginRoute } from "../LoginForm/loginFormHelpers";
import { signInWithPasskey } from "../PasskeySection/passkeyFlows";

const subscribeToNothing = (): (() => void) => () => undefined;
const getSupportSnapshot = (): boolean => browserSupportsWebAuthn();
const getServerSupportSnapshot = (): boolean => false;

const PasskeySignInButton: FC = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSupported = useSyncExternalStore(subscribeToNothing, getSupportSnapshot, getServerSupportSnapshot);

  if (!isSupported) {
    return null;
  }

  const handleClick = (): void => {
    startTransition(async () => {
      const result = await signInWithPasskey();

      if (result.status === "success") {
        toast.success("Successfully logged in!");
        router.push(getPostLoginRoute(result.redirectTo));
      } else if (result.status === "error") {
        toast.error("Couldn't sign in with your passkey", { description: result.message });
      }
    });
  };

  return (
    <Button disabled={isPending} onClick={handleClick} type="button" variant="outline">
      <PiFingerprintDuotone />
      {isPending ? "Waiting for your passkey..." : "Sign in with a passkey"}
    </Button>
  );
};

export default PasskeySignInButton;
