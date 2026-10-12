"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import type { PasskeySummary } from "@/server/loaders/passkey";
import "client-only";

import { useRouter } from "next/navigation";
import { type FC, useSyncExternalStore, useTransition } from "react";
import { PiPlusDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { PasskeyRow } from "./PasskeyRow";
import { registerPasskey } from "./passkeyFlows";

type Props = {
  passkeys: PasskeySummary[];
};

const subscribeToNothing = (): (() => void) => () => undefined;
const getSupportSnapshot = (): boolean => browserSupportsWebAuthn();
const getServerSupportSnapshot = (): boolean => false;

const PasskeySection: FC<Props> = ({ passkeys }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isSupported = useSyncExternalStore(subscribeToNothing, getSupportSnapshot, getServerSupportSnapshot);

  const handleAdd = (): void => {
    startTransition(async () => {
      const result = await registerPasskey();

      if (result.status === "success") {
        toast.success("Passkey added");
        router.refresh();
      } else if (result.status === "error") {
        toast.error("Couldn't add your passkey", { description: result.message });
      }
    });
  };

  return (
    <div className="col-span-full">
      <p className="text-center mb-2">Sign in with your fingerprint, face or device PIN instead of a password</p>
      {passkeys.length > 0 && (
        <ul className="divide-y divide-border mb-2">
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey.id} passkey={passkey} />
          ))}
        </ul>
      )}
      <div className="flex justify-center">
        {isSupported ? (
          <Button disabled={isPending} onClick={handleAdd} type="button" variant="primary">
            <PiPlusDuotone />
            {isPending ? "Waiting for your passkey..." : "Add a passkey"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">This browser doesn&rsquo;t support passkeys.</p>
        )}
      </div>
    </div>
  );
};

export default PasskeySection;
