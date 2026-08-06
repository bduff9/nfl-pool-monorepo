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

import { updateUserPaid } from "@/server/actions/payment";
import { toggleUserSurvivor } from "@/server/actions/survivor";
import { markUserAsTrusted, removeUserFromAdmin } from "@/server/actions/user";
import type { getTrustedUsersDropdown } from "@/server/loaders/user";

import type { User } from "./AdminUserColumns";

type UserRowActionsProps = {
  trustedUsers: Awaited<ReturnType<typeof getTrustedUsersDropdown>>;
  user: User;
};

export const UserRowActions: FC<UserRowActionsProps> = ({ trustedUsers, user }) => {
  const [paid, setPaid] = useState<number>(0);
  const [paidModalOpen, setPaidModalOpen] = useState<boolean>(false);
  const [trustUserModalOpen, setTrustUserModalOpen] = useState<boolean>(false);
  const [referredByUserId, setReferredByUserId] = useState<number>(0);
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState<boolean>(false);

  const { execute: updatePaid, isPending: isPaidPending } = useAction(updateUserPaid, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("Successfully updated user paid amount!");
      setPaidModalOpen(false);
    },
  });

  const { execute: trustUser, isPending: isTrustUserPending } = useAction(markUserAsTrusted, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("Successfully marked user as trusted!");
      setTrustUserModalOpen(false);
    },
  });

  const { execute: deleteUser, isPending: isDeleteUserPending } = useAction(removeUserFromAdmin, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("Successfully removed user!");
      setDeleteUserModalOpen(false);
    },
  });

  const { execute: toggleSurvivor, isPending: isSurvivorPending } = useAction(toggleUserSurvivor, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: () => {
      toast.success("Successfully updated user survivor status!");
    },
  });

  const handlePaidSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updatePaid({
      amountPaid: paid,
      userID: user.UserID,
    });
  };

  const handlePaidChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPaid(Number(event.target.value));
  };

  const handleReferredByChange = (value: string) => {
    setReferredByUserId(Number(value));
  };

  const handleTrustUser = () => {
    trustUser({
      referredByUserId,
      userId: user.UserID,
    });
  };

  const handleDeleteUser = () => {
    deleteUser({
      userID: user.UserID,
    });
  };

  const handleToggleSurvivor = () => {
    toggleSurvivor({
      playsSurvivor: user.UserPlaysSurvivor === 1 ? 0 : 1,
      userID: user.UserID,
    });
  };

  return (
    <div className="flex">
      {((user.UserOwes ?? 0) > 0 || user.UserDoneRegistering === 1) && (
        <Dialog onOpenChange={setPaidModalOpen} open={paidModalOpen}>
          <DialogTrigger asChild>
            <Button
              aria-label={`${user.UserFirstName} ${user.UserLastName} has paid $${user.UserPaid ?? 0} / $${user.UserOwes ?? 0}`}
              variant="ghost"
            >
              <FaDollarSign
                className={cn(
                  "cursor-pointer size-6",
                  (user.UserPaid ?? 0) === 0
                    ? "text-red-600"
                    : user.UserPaid === user.UserOwes
                      ? "text-green-600"
                      : "text-amber-500",
                )}
              />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handlePaidSubmit}>
              <DialogHeader>
                <DialogTitle>
                  User has paid ${user.UserPaid ?? 0} / ${user.UserOwes ?? 0}
                </DialogTitle>
                <DialogDescription />
              </DialogHeader>
              <div>
                <Label htmlFor="paid">How much did they just pay?</Label>
                <Input
                  id="paid"
                  max={user.UserOwes ?? undefined}
                  onChange={handlePaidChange}
                  type="number"
                  value={paid}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={isPaidPending} type="submit" variant="primary">
                  {!!isPaidPending && <PiFootballDuotone className="animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {user.UserTrusted !== 1 && (
        <>
          <Dialog onOpenChange={setTrustUserModalOpen} open={trustUserModalOpen}>
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
                <Select
                  onValueChange={handleReferredByChange}
                  value={referredByUserId ? referredByUserId.toString() : ""}
                >
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
                <Button disabled={isTrustUserPending} onClick={handleTrustUser} variant="primary">
                  {!!isTrustUserPending && <PiFootballDuotone className="animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog onOpenChange={setDeleteUserModalOpen} open={deleteUserModalOpen}>
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
                <Button disabled={isDeleteUserPending} onClick={handleDeleteUser} variant="destructive">
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      {user.UserDoneRegistering === 1 && (
        <Button
          aria-label={`${user.UserPlaysSurvivor ? "Remove" : "Register"} ${user.UserFirstName} ${user.UserLastName} ${
            user.UserPlaysSurvivor ? "from" : "to"
          } survivor pool`}
          disabled={isSurvivorPending}
          onClick={handleToggleSurvivor}
          variant="ghost"
        >
          <PiIslandDuotone
            className={cn("cursor-pointer size-6", user.UserPlaysSurvivor ? "text-green-600" : "text-red-600")}
          />
        </Button>
      )}
    </div>
  );
};
