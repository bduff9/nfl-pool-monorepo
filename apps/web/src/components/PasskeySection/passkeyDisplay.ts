// Fixed to UTC so server-rendered and client-rendered text always match (no hydration mismatch).
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const formatPasskeyDate = (date: Date): string => DATE_FORMAT.format(date);

export const describePasskeyUsage = (addedAt: Date, lastUsedAt: Date | null): string => {
  const added = `Added ${formatPasskeyDate(addedAt)}`;

  return lastUsedAt ? `${added} · Last used ${formatPasskeyDate(lastUsedAt)}` : `${added} · Never used`;
};
