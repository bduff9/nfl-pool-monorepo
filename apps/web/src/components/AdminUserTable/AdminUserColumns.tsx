"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
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
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { FaDollarSign, FaEnvelope, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { PiFootballDuotone, PiIslandDuotone } from "react-icons/pi";
import { useServerAction } from "zsa-react";

import { processFormState } from "@/lib/zsa";
import { updateUserPaid } from "@/server/actions/payment";
import { toggleUserSurvivor } from "@/server/actions/survivor";
import { getUserDropdown, markUserAsTrusted, removeUserFromAdmin } from "@/server/actions/user";
import type { getAdminUsers } from "@/server/loaders/user";

export type User = Awaited<ReturnType<typeof getAdminUsers>>["results"][number];

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "UserName",
    cell: ({ row }) => {
      return (
        <>
          <div className="font-bold" title={row.original.UserName ?? undefined}>
            {row.original.UserFirstName} {row.original.UserLastName}
          </div>
          <div className="text-muted">{row.original.UserTeamName || `${row.original.UserFirstName}'s Team`}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
  },
  {
    cell: ({ row }) => {
      const [paid, setPaid] = useState<number>(0);
      const [paidModalOpen, setPaidModalOpen] = useState<boolean>(false);
      const [trustUserModalOpen, setTrustUserModalOpen] = useState<boolean>(false);
      const [userList, setUserList] = useState<{ UserID: number; UserName: string | null }[]>([]);
      const [referredByUserId, setReferredByUserId] = useState<number>(0);
      const [deleteUserModalOpen, setDeleteUserModalOpen] = useState<boolean>(false);
      const { execute: updatePaid, isPending: isPaidPending } = useServerAction(updateUserPaid);
      const { execute: loadUsers } = useServerAction(getUserDropdown);
      const { execute: trustUser, isPending: isTrustUserPending } = useServerAction(markUserAsTrusted);
      const { execute: deleteUser, isPending: isDeleteUserPending } = useServerAction(removeUserFromAdmin);
      const { isPending: isSurvivorPending } = useServerAction(toggleUserSurvivor);

      useEffect(() => {
        const getUserList = async () => {
          if (row.original.UserTrusted === 1) {
            return;
          }

          const [users] = await loadUsers();

          setUserList(users ?? []);
        };

        getUserList();
      }, [loadUsers, row.original.UserTrusted]);

      return (
        <div className="flex">
          {((row.original.UserOwes ?? 0) > 0 || row.original.UserDoneRegistering === 1) && (
            <Dialog onOpenChange={setPaidModalOpen} open={paidModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <FaDollarSign
                    className={cn(
                      "cursor-pointer size-6",
                      (row.original.UserPaid ?? 0) === 0
                        ? "text-red-600"
                        : row.original.UserPaid === row.original.UserOwes
                          ? "text-green-600"
                          : "text-amber-500",
                    )}
                    title={`${row.original.UserFirstName} ${row.original.UserLastName} has paid $${row.original.UserPaid} / $${row.original.UserOwes}`}
                  />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    User has paid ${row.original.UserPaid ?? 0} / ${row.original.UserOwes ?? 0}
                  </DialogTitle>
                  <DialogDescription />
                </DialogHeader>
                <div>
                  <Label htmlFor="paid">How much did they just pay?</Label>
                  <Input
                    id="paid"
                    max={row.original.UserOwes ?? undefined}
                    onChange={(event) => setPaid(Number(event.target.value))}
                    type="number"
                    value={paid}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={isPaidPending}
                    onClick={async () => {
                      const result = await updatePaid({
                        amountPaid: paid,
                        userID: row.original.UserID,
                      });

                      processFormState(
                        result,
                        () => {
                          setPaidModalOpen(false);
                        },
                        "Successfully updated user paid amount!",
                      );
                    }}
                    variant="primary"
                  >
                    {isPaidPending && <PiFootballDuotone className="animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {row.original.UserTrusted !== 1 && (
            <>
              <Dialog onOpenChange={setTrustUserModalOpen} open={trustUserModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <FaThumbsUp
                      className="text-green-600 cursor-pointer size-5"
                      title={`Mark ${row.original.UserFirstName} ${row.original.UserLastName} as trusted`}
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Who referred this user?</DialogTitle>
                    <DialogDescription />
                  </DialogHeader>
                  <div>
                    <Label htmlFor="referredBy">
                      User entered "{row.original.UserReferredByRaw}" as their referrer during registration
                    </Label>
                    <Select
                      onValueChange={(value) => setReferredByUserId(Number(value))}
                      value={referredByUserId ? referredByUserId.toString() : ""}
                    >
                      <SelectTrigger id="referredBy">
                        <SelectValue placeholder="-- Select a user --" />
                      </SelectTrigger>
                      <SelectContent>
                        {userList.map((user) => (
                          <SelectItem key={`user-${user.UserID}`} value={user.UserID.toString()}>
                            {user.UserName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                      disabled={isTrustUserPending}
                      onClick={async () => {
                        const result = await trustUser({
                          referredByUserId,
                          userId: row.original.UserID,
                        });

                        processFormState(
                          result,
                          () => {
                            setTrustUserModalOpen(false);
                          },
                          "Successfully marked user as trusted!",
                        );
                      }}
                      variant="primary"
                    >
                      {isTrustUserPending && <PiFootballDuotone className="animate-spin" />}
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog onOpenChange={setDeleteUserModalOpen} open={deleteUserModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <FaThumbsDown
                      className="text-red-600 cursor-pointer size-5"
                      title={`Remove ${row.original.UserFirstName} ${row.original.UserLastName} from DB`}
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove User?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove {row.original.UserFirstName} {row.original.UserLastName} from the
                      DB?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                      disabled={isDeleteUserPending}
                      onClick={async () => {
                        const result = await deleteUser({
                          userID: row.original.UserID,
                        });

                        processFormState(
                          result,
                          () => {
                            setDeleteUserModalOpen(false);
                          },
                          "Successfully removed user!",
                        );
                      }}
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {row.original.UserDoneRegistering === 1 && (
            <Button
              disabled={isSurvivorPending}
              onClick={async () => {
                const result = await toggleUserSurvivor({
                  playsSurvivor: row.original.UserPlaysSurvivor === 1 ? 0 : 1,
                  userID: row.original.UserID,
                });

                processFormState(result, () => {}, "Successfully updated user survivor status!");
              }}
              variant="ghost"
            >
              <PiIslandDuotone
                className={cn(
                  "cursor-pointer size-6",
                  row.original.UserPlaysSurvivor ? "text-green-600" : "text-red-600",
                )}
                title={`${row.original.UserPlaysSurvivor ? "Remove" : "Register"} ${
                  row.original.UserFirstName
                } ${row.original.UserLastName} ${row.original.UserPlaysSurvivor ? "from" : "to"} survivor pool`}
              />
            </Button>
          )}
        </div>
      );
    },
    header: "",
    id: "Actions",
  },
  {
    accessorKey: "UserEmail",
    cell: ({ row }) => {
      return (
        <>
          {row.original.UserEmail}
          {row.original.UserCommunicationsOptedOut === 1 && <div className="text-red-600">Unsubscribed</div>}
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Email" />,
  },
  {
    accessorFn: (row) => row.referredByUserName ?? row.UserReferredByRaw,
    header: "Referral",
  },
  {
    accessorKey: "UserStatus",
    cell: ({ row }) => {
      return (
        <div
          className={cn(
            row.original.UserStatus === "Registered" && "text-green-600",
            row.original.UserStatus === "Unverified" && "text-red-600",
            row.original.UserStatus === "Untrusted" && "text-amber-600",
            row.original.UserStatus === "Verified" && "text-muted",
          )}
          title={`Years played: ${row.original.YearsPlayed}`}
        >
          {row.original.UserStatus}
        </div>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "UserNotifications",
    cell: ({ row }) => {
      return row.original.UserNotifications.map((notification) => (
        <div className="flex-1 text-nowrap" key={`notification-${notification.NotificationID}`}>
          {notification.NotificationTypeDescription}:{" "}
          {notification.NotificationEmail ? `E${notification.NotificationEmailHoursBefore ?? ""}` : ""}{" "}
          {notification.NotificationSMS ? `S${notification.NotificationSMSHoursBefore ?? ""}` : ""}
        </div>
      ));
    },
    header: "Notifications",
  },
  {
    accessorFn: (row) => `${row.UserAutoPickStrategy}: ${row.UserAutoPicksLeft}`,
    header: ({ column }) => <SortableColumnHeader column={column} title="Auto Picks" />,
    id: "Auto Picks",
  },
  {
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          {row.original.UserHasPassword === 1 && (
            <FaEnvelope className="text-yellow-400 size-6" title="Email sign in" />
          )}
          {row.original.UserHasGoogle === 1 && <FcGoogle className="size-6" title="Google sign in" />}
        </div>
      );
    },
    header: "Logins",
    id: "Logins",
  },
  {
    accessorKey: "UserStatus2",
    header: "UserStatus2",
    id: "UserStatus2",
  },
  {
    accessorKey: "UserStatus3",
    header: "UserStatus3",
    id: "UserStatus3",
  },
  {
    accessorKey: "UserIsOwing",
    header: "UserIsOwing",
    id: "UserIsOwing",
  },
];
