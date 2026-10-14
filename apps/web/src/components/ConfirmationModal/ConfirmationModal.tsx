/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nfl-pool-monorepo/ui/components/dialog";
import { LoaderCircle } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { createCloseIntent } from "./closeIntent";

type ConfirmationModalProps = {
  acceptButton?: string;
  body: ReactNode;
  cancelButton?: string;
  onAccept: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  title: string;
};

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  acceptButton = "OK",
  body,
  cancelButton = "Cancel",
  onAccept,
  onCancel,
  title,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(true);
  const [intent] = useState(createCloseIntent);

  const handleAccept = async (): Promise<void> => {
    setLoading(true);

    try {
      await onAccept();
      intent.accept();
      setOpen(false);
    } catch (error) {
      console.error("Failed to confirm action", error);
      toast.error("Something went wrong!", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }

    setLoading(false);
  };

  // Escape or a tap outside (false), or opening again (true)
  const handleOpenChange = (next: boolean): void => {
    if (next) {
      intent.open();
    } else {
      intent.cancel();
    }

    setOpen(next);
  };

  const handleCancel = (): void => {
    intent.cancel();
    setOpen(false);
  };

  // Radix calls this once the dialog has closed and finished animating out, and also whenever its focus scope unmounts
  // for another reason, so only a cancel the user made tells the caller. It waits until now since callers unmount the
  // modal on cancel, which would cut its close animation.
  const handleCloseAutoFocus = (): void => {
    if (intent.takeCancel()) {
      void onCancel();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent onCloseAutoFocus={handleCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{body}</DialogDescription>
        <DialogFooter>
          <Button disabled={loading} onClick={handleCancel} variant="outline">
            {cancelButton}
          </Button>
          <Button disabled={loading} onClick={handleAccept}>
            {loading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              acceptButton
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
