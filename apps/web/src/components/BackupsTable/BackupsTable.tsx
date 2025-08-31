"use client";

import "client-only";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import dynamic from "next/dynamic";
import { type FC, useState } from "react";
import { PiDatabaseDuotone, PiFootballDuotone } from "react-icons/pi";
import { toast } from "sonner";

import { formatDateForBackup } from "@/lib/dates";
import { processFormState } from "@/lib/zsa";
import { restoreBackup } from "@/server/actions/backup";
import type { getAdminBackups } from "@/server/loaders/backup";

const ConfirmationModal = dynamic(() => import("@/components/ConfirmationModal/ConfirmationModal"), { ssr: false });

type Props = {
  count: number;
  results: Awaited<ReturnType<typeof getAdminBackups>>["results"];
};

const BackupsTable: FC<Props> = ({ count, results }) => {
  const [loading, setLoading] = useState<null | string>(null);
  const [callback, setCallback] = useState<(() => Promise<void>) | null>(null);

  const restoreABackup = async (backupName: string): Promise<void> => {
    const toastId = toast.loading("Restoring...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await restoreBackup({ backupName });

    processFormState(
      result,
      () => {
        /* NOOP */
      },
      `Successfully restored backup ${backupName}!`,
    );
    toast.dismiss(toastId);
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
              {results.map((backup) => (
                <TableRow key={`backup-${backup.backupName}`}>
                  <TableHead className="flex justify-center items-center" scope="row">
                    {loading === null && (
                      <PiDatabaseDuotone
                        className="cursor-pointer text-black size-4"
                        onClick={() => {
                          setLoading(backup.backupName);
                          setCallback(() => () => restoreABackup(backup.backupName));
                        }}
                      />
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
      {callback && (
        <ConfirmationModal
          acceptButton="Restore"
          body={`Are you certain you want to restore backup ${loading}?  This cannot be undone.`}
          onAccept={callback}
          onCancel={() => {
            setCallback(null);
            setLoading(null);
          }}
          title="Are you sure?"
        />
      )}
    </div>
  );
};

export default BackupsTable;
