"use client";

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
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useAction } from "next-safe-action/hooks";
import { type ChangeEvent, type FC, type FormEvent, useState } from "react";
import { FaDollarSign, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { PiFootballDuotone, PiIslandDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { updateUserPaid } from "@/server/actions/payment";
import { toggleUserSurvivor } from "@/server/actions/survivor";
import { markUserAsTrusted, removeUserFromAdmin } from "@/server/actions/user";
import type { getTrustedUsersDropdown } from "@/server/loaders/user";

import type { User } from "./AdminUserColumns";

type UserRowActionsProps = {
  trustedUsers: Awaited<ReturnType<typeof getTrustedUsersDropdown>>;
  user: User;
};

const getPaidIconColor = (user: User): string => {
  if ((user.UserPaid ?? 0) === 0) {
    return "text-red-600";
  }

  return user.UserPaid === user.UserOwes ? "text-green-600" : "text-amber-500";
};

const getPaidSummary = (user: User): string => `$${user.UserPaid ?? 0} / $${user.UserOwes ?? 0}`;

const PaidDialog: FC<{ user: User }> = ({ user }) => {
  const paidSummary = getPaidSummary(user);
  const [paid, setPaid] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const { execute: updatePaid, isPending } = useAction(updateUserPaid, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Successfully updated user paid amount!");
      setOpen(false);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updatePaid({
      amountPaid: paid,
      userID: user.UserID,
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPaid(Number(event.target.value));
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button aria-label={`${user.UserFirstName} ${user.UserLastName} has paid ${paidSummary}`} variant="ghost">
          <FaDollarSign className={cn("cursor-pointer size-6", getPaidIconColor(user))} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>User has paid {paidSummary}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div>
            <Label htmlFor="paid">How much did they just pay?</Label>
            <Input id="paid" max={user.UserOwes ?? undefined} onChange={handleChange} type="number" value={paid} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={isPending} type="submit" variant="primary">
              {!!isPending && <PiFootballDuotone className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TrustUserDialog: FC<UserRowActionsProps> = ({ trustedUsers, user }) => {
  const [referredByUserId, setReferredByUserId] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const { execute: trustUser, isPending } = useAction(markUserAsTrusted, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Successfully marked user as trusted!");
      setOpen(false);
    },
  });

  const handleReferredByChange = (value: string) => {
    setReferredByUserId(Number(value));
  };

  const handleTrustUser = () => {
    trustUser({
      referredByUserId,
      userId: user.UserID,
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button aria-label={`Mark ${user.UserFirstName} ${user.UserLastName} as trusted`} variant="ghost">
          <FaThumbsUp className="text-green-600 cursor-pointer size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Who referred this user?</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div>
          <Label htmlFor="referredBy">
            User entered "{user.UserReferredByRaw}" as their referrer during registration
          </Label>
          <Select onValueChange={handleReferredByChange} value={referredByUserId ? referredByUserId.toString() : ""}>
            <SelectTrigger id="referredBy">
              <SelectValue placeholder="-- Select a user --">
                {trustedUsers.find((otherUser) => otherUser.UserID === referredByUserId)?.UserName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {trustedUsers.map((otherUser) => (
                <SelectItem key={`user-${otherUser.UserID}`} value={otherUser.UserID.toString()}>
                  {otherUser.UserName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={isPending} onClick={handleTrustUser} variant="primary">
            {!!isPending && <PiFootballDuotone className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteUserDialog: FC<{ user: User }> = ({ user }) => {
  const [open, setOpen] = useState<boolean>(false);

  const { execute: deleteUser, isPending } = useAction(removeUserFromAdmin, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Successfully removed user!");
      setOpen(false);
    },
  });

  const handleDeleteUser = () => {
    deleteUser({
      userID: user.UserID,
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Remove ${[user.UserFirstName, user.UserLastName].filter(Boolean).join(" ") || "user"} from DB`}
          variant="ghost"
        >
          <FaThumbsDown className="text-red-600 cursor-pointer size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {user.UserFirstName} {user.UserLastName} from the DB?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={isPending} onClick={handleDeleteUser} variant="destructive">
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SurvivorToggleButton: FC<{ user: User }> = ({ user }) => {
  const { execute: toggleSurvivor, isPending } = useAction(toggleUserSurvivor, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Successfully updated user survivor status!");
    },
  });

  const handleToggleSurvivor = () => {
    toggleSurvivor({
      playsSurvivor: user.UserPlaysSurvivor === 1 ? 0 : 1,
      userID: user.UserID,
    });
  };

  return (
    <Button
      aria-label={`${user.UserPlaysSurvivor ? "Remove" : "Register"} ${user.UserFirstName} ${user.UserLastName} ${
        user.UserPlaysSurvivor ? "from" : "to"
      } survivor pool`}
      disabled={isPending}
      onClick={handleToggleSurvivor}
      variant="ghost"
    >
      <PiIslandDuotone
        className={cn("cursor-pointer size-6", user.UserPlaysSurvivor ? "text-green-600" : "text-red-600")}
      />
    </Button>
  );
};

export const UserRowActions: FC<UserRowActionsProps> = ({ trustedUsers, user }) => {
  const canTakePayment = (user.UserOwes ?? 0) > 0 || user.UserDoneRegistering === 1;

  return (
    <div className="flex">
      {!!canTakePayment && <PaidDialog user={user} />}
      {user.UserTrusted !== 1 && (
        <>
          <TrustUserDialog trustedUsers={trustedUsers} user={user} />
          <DeleteUserDialog user={user} />
        </>
      )}
      {user.UserDoneRegistering === 1 && <SurvivorToggleButton user={user} />}
    </div>
  );
};
