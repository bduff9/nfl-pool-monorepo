const USER_STATUS_CLASS: Record<string, string> = {
  Registered: "text-green-600",
  Untrusted: "text-amber-600",
  Unverified: "text-red-600",
  Verified: "text-muted-foreground",
};

export const getUserStatusClass = (status: string | null | undefined): string | undefined =>
  USER_STATUS_CLASS[status ?? ""];

export const formatNotificationChannel = (
  prefix: "E" | "S",
  enabled: unknown,
  hoursBefore: number | null | undefined,
): string => (enabled ? `${prefix}${hoursBefore ?? ""}` : "");
