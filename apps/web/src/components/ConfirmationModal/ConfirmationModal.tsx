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
  DialogTitle
} from "@nfl-pool-monorepo/ui/components/dialog";
import { Loader2 } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useState } from "react";

type ConfirmationModal = {
  acceptButton?: string;
  body: ReactNode;
  cancelButton?: string;
  onAccept: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  title: string;
};

const ConfirmationModal: FC<ConfirmationModal> = ({
  acceptButton = "OK",
  body,
  cancelButton = "Cancel",
  onAccept,
  onCancel,
  title,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(true);

  const handleAccept = async (): Promise<void> => {
    setLoading(true);
    await onAccept();
    setLoading(false);
    setOpen(false);
  };

  const handleCancel = async (): Promise<void> => {
    await onCancel();
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={(open) => setOpen(open)} open={open}>
      <DialogContent>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
