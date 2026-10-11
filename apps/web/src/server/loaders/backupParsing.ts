export type Backup = {
  backupName: string;
  backupDate: Date;
  backupWhen: "AM" | "PM";
};

/** Parses names like `prefix-2024-01-01-AM.sql`; returns null when the AM/PM segment is missing or invalid. */
export const parseBackupName = (name: string): Backup | null => {
  const parts = name.split("-").slice(1);
  const amPm = parts.pop()?.replace(".sql", "");

  if (amPm !== "AM" && amPm !== "PM") {
    return null;
  }

  return { backupDate: new Date(parts.join("-")), backupName: name, backupWhen: amPm };
};
