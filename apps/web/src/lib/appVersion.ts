// The commit this build was made from, inlined at build time. Empty in dev and local builds, where update checks are off.
export const APP_VERSION = process.env.NEXT_PUBLIC_LOGROCKET_RELEASE ?? "";

export const isNewVersionAvailable = (running: string, latest: unknown): boolean =>
  running !== "" && typeof latest === "string" && latest !== "" && latest !== running;
