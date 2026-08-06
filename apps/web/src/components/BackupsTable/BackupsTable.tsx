"use client";

import "client-only";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import dynamic from "next/dynamic";
import { useAction } from "next-safe-action/hooks";
import { type FC, type MouseEvent, useRef, useState } from "react";
import { PiDatabaseDuotone, PiFootballDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { formatDateForBackup } from "@/lib/dates";
import { restoreBackup } from "@/server/actions/backup";
import type { getAdminBackups } from "@/server/loaders/backup";

const ConfirmationModal = dynamic(() => import("@/components/ConfirmationModal/ConfirmationModal"), { ssr: false });

type Props = {
  count: number;
  results: Awaited<ReturnType<typeof getAdminBackups>>["results"];
};

const BackupsTable: FC<Props> = ({ count, results }) => {
  const [loading, setLoading] = useState<null | string>(null);
  const [callback, setCallback] = useState<(() => void) | null>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute: executeRestore } = useAction(restoreBackup, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setCallback(null);
      setLoading(null);
    },
    onSuccess: () => {
      toast.success(`Successfully restored backup ${loading}!`);
    },
  });

  const restoreABackup = (backupName: string): void => {
    toastIdRef.current = toast.loading("Restoring...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    executeRestore({ backupName });
  };

  const handleRestoreClick = (event: MouseEvent<HTMLButtonElement>) => {
    const { backupName } = event.currentTarget.dataset;

    if (!backupName) {
      return;
    }

    setLoading(backupName);
    setCallback(() => () => restoreABackup(backupName));
  };

  const handleCancelConfirmation = () => {
    setCallback(null);
    setLoading(null);
  };

  return (
    <div className="flex flex-col min-h-screen px-6">
      <div className="w-full text-center md:text-start">
        {count} {count === 1 ? "Backup" : "Backups"}
      </div>
      <div className={cn("w-full h-auto md:h-[90vh]")}>
        <div className="bg-gray-100/80 rounded">
          <Table>
            <TableHeader>
              <TableRow className="hidden md:table-row">
                <TableHead className="text-black" scope="col">
                  Restore
                </TableHead>
                <TableHead className="text-black" scope="col">
                  Name
                </TableHead>
                <TableHead className="text-black" scope="col">
                  Date
                </TableHead>
                <TableHead className="text-black" scope="col">
                  AM/PM
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 && (
                <TableRow>
                  <TableCell className="text-center text-muted-foreground" colSpan={4}>
                    No backups found
                  </TableCell>
                </TableRow>
              )}
              {results.map((backup) => (
                <TableRow key={`backup-${backup.backupName}`}>
                  <TableHead className="flex justify-center items-center" scope="row">
                    {loading === null && (
                      <button
                        aria-label={`Restore backup ${backup.backupName}`}
                        data-backup-name={backup.backupName}
                        onClick={handleRestoreClick}
                        type="button"
                      >
                        <PiDatabaseDuotone className="cursor-pointer text-black size-4" />
                      </button>
                    )}
                    {loading === backup.backupName && (
                      <PiFootballDuotone
                        aria-hidden="true"
                        className="animate-spin hidden md:inline-block text-yellow-950"
                      />
                    )}
                  </TableHead>
                  <TableCell>{backup.backupName}</TableCell>
                  <TableCell>{formatDateForBackup(backup.backupDate)}</TableCell>
                  <TableCell>{backup.backupWhen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {!!callback && (
        <ConfirmationModal
          acceptButton="Restore"
          body={`Are you certain you want to restore backup ${loading}?  This cannot be undone.`}
          onAccept={callback}
          onCancel={handleCancelConfirmation}
          title="Are you sure?"
        />
      )}
    </div>
  );
};

export default BackupsTable;
