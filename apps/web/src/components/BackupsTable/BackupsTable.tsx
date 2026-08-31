"use client";

import "client-only";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import dynamic from "next/dynamic";
import { useAction } from "next-safe-action/hooks";
import { type FC, type MouseEvent, useRef, useState } from "react";
import { PiDatabaseDuotone, PiFootballDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { formatDateForBackup } from "@/lib/dates";
import { restoreBackup } from "@/server/actions/backup";
import type { getAdminBackups } from "@/server/loaders/backup";

const ConfirmationModal = dynamic(() => import("@/components/ConfirmationModal/ConfirmationModal"), { ssr: false });

type Props = {
  count: number;
  results: Awaited<ReturnType<typeof getAdminBackups>>["results"];
};

const BackupsTable: FC<Props> = ({ count, results }) => {
  const [pendingBackupName, setPendingBackupName] = useState<null | string>(null);
  const [restoringBackupName, setRestoringBackupName] = useState<null | string>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute: executeRestore } = useAction(restoreBackup, {
    onError: onActionError,
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setRestoringBackupName(null);
    },
    onSuccess: () => {
      toast.success(`Successfully restored backup ${restoringBackupName}!`);
    },
  });

  const restoreABackup = (backupName: string): void => {
    setRestoringBackupName(backupName);
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

    setPendingBackupName(backupName);
  };

  const handleAcceptConfirmation = () => {
    if (pendingBackupName) {
      restoreABackup(pendingBackupName);
    }

    setPendingBackupName(null);
  };

  const handleCancelConfirmation = () => {
    setPendingBackupName(null);
  };

  return (
    <div className="flex flex-col min-h-screen px-6">
      <div className="w-full text-center md:text-start">
        {count} {count === 1 ? "Backup" : "Backups"}
      </div>
      <div className={cn("w-full h-auto md:h-[90vh]")}>
        <div className="bg-muted/80 rounded">
          <Table>
            <TableHeader>
              <TableRow className="hidden md:table-row">
                <TableHead className="text-foreground" scope="col">
                  Restore
                </TableHead>
                <TableHead className="text-foreground" scope="col">
                  Name
                </TableHead>
                <TableHead className="text-foreground" scope="col">
                  Date
                </TableHead>
                <TableHead className="text-foreground" scope="col">
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
                    {pendingBackupName === null && restoringBackupName === null && (
                      <button
                        aria-label={`Restore backup ${backup.backupName}`}
                        data-backup-name={backup.backupName}
                        onClick={handleRestoreClick}
                        type="button"
                      >
                        <PiDatabaseDuotone className="cursor-pointer text-foreground size-4" />
                      </button>
                    )}
                    {restoringBackupName === backup.backupName && (
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
      {!!pendingBackupName && (
        <ConfirmationModal
          acceptButton="Restore"
          body={`Are you certain you want to restore backup ${pendingBackupName}?  This cannot be undone.`}
          onAccept={handleAcceptConfirmation}
          onCancel={handleCancelConfirmation}
          title="Are you sure?"
        />
      )}
    </div>
  );
};

export default BackupsTable;
