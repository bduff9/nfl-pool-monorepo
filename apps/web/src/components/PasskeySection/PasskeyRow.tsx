"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@nfl-pool-monorepo/ui/components/alert-dialog";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@nfl-pool-monorepo/ui/components/dialog";
import { Input } from "@nfl-pool-monorepo/ui/components/input";

import { onActionError } from "@/lib/actionErrorToast";
import { deletePasskey, renamePasskey } from "@/server/actions/passkey";
import type { PasskeySummary } from "@/server/loaders/passkey";
import "client-only";

import { useAction } from "next-safe-action/hooks";
import { type ChangeEventHandler, type FC, type SubmitEventHandler, useState } from "react";
import { PiFingerprintDuotone, PiPencilSimpleDuotone, PiTrashDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { describePasskeyUsage } from "./passkeyDisplay";

type RenamePasskeyDialogProps = { passkey: PasskeySummary };

const RenamePasskeyDialog: FC<RenamePasskeyDialogProps> = ({ passkey }) => {
  const [isOpen, setIsOpen] = useState(false);
  // null until the user edits, so the input follows the saved name without copying a prop into state.
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? passkey.name;
  const { execute, isPending } = useAction(renamePasskey, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Passkey renamed");
      setIsOpen(false);
      setDraft(null);
    },
  });

  const handleNameChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setDraft(event.target.value);
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    // This dialog renders inside the profile <form>'s React tree (via a portal), so stop the submit from reaching it.
    event.stopPropagation();
    execute({ name, passkeyId: passkey.id });
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button aria-label={`Rename ${passkey.name}`} size="icon" type="button" variant="ghost">
          <PiPencilSimpleDuotone />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename passkey</DialogTitle>
            <DialogDescription>Choose a name that helps you recognize this passkey.</DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Passkey name"
            className="my-4"
            maxLength={100}
            onChange={handleNameChange}
            required
            value={name}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={isPending || name.trim() === ""} type="submit" variant="primary">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeletePasskeyDialog: FC<RenamePasskeyDialogProps> = ({ passkey }) => {
  const { execute, isPending } = useAction(deletePasskey, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Passkey deleted");
    },
  });

  const handleDelete = (): void => {
    execute({ passkeyId: passkey.id });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button aria-label={`Delete ${passkey.name}`} size="icon" type="button" variant="ghost">
          <PiTrashDuotone />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this passkey?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer be able to sign in with &ldquo;{passkey.name}&rdquo;. You can add it again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const PasskeyRow: FC<RenamePasskeyDialogProps> = ({ passkey }) => (
  <li className="flex items-center gap-3 py-2">
    <PiFingerprintDuotone aria-hidden className="size-6 shrink-0" />
    <div className="min-w-0 grow">
      <div className="truncate font-medium">{passkey.name}</div>
      <div className="text-sm text-muted-foreground">{describePasskeyUsage(passkey.addedAt, passkey.lastUsedAt)}</div>
    </div>
    <RenamePasskeyDialog passkey={passkey} />
    <DeletePasskeyDialog passkey={passkey} />
  </li>
);
