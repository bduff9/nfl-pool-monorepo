export const getPartialFailureDescription = (metadata: Record<string, unknown> | null | undefined): string | null => {
  const { failedCount, totalCount } = metadata ?? {};

  if (typeof failedCount !== "number" || failedCount <= 0) {
    return null;
  }

  return `${failedCount} of ${totalCount} emails failed to send. Check the server logs for details.`;
};
