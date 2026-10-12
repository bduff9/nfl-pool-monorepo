export type ShareMethod = "files" | "link" | "clipboard";

type ShareSupport = {
  fileReady: boolean;
  canShareFiles: boolean;
  canShare: boolean;
};

// fileReady is false while the image is still loading, so a tap never waits on it. Prefer sharing the image itself, then a link, and copy to the clipboard where the share sheet is unavailable.
export const chooseShareMethod = ({ fileReady, canShareFiles, canShare }: ShareSupport): ShareMethod => {
  if (fileReady && canShareFiles) {
    return "files";
  }

  return canShare ? "link" : "clipboard";
};

export const getShareFileName = (imageUrl: string): string => {
  const match = /\/share\/([a-z]+)\/(\d+)/.exec(imageUrl);

  return match ? `${match[1]}-${match[2]}.png` : "share.png";
};

export const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === "AbortError";

export const isNotAllowedError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "NotAllowedError";

export const buildClipboardText = (text: string, url?: string): string => [text, url].filter(Boolean).join(" ");
