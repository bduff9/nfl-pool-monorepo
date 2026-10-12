"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { type FC, useEffect, useState, useTransition } from "react";
import { PiShareNetworkDuotone, PiSpinnerGapBold } from "react-icons/pi";
import { toast } from "sonner";

import { hapticTap } from "@/lib/haptics";
import {
  buildClipboardText,
  chooseShareMethod,
  getShareFileName,
  isAbortError,
  isNotAllowedError,
} from "@/lib/share/shareMethod";

type ShareButtonProps = {
  title: string;
  text: string;
  imageUrl?: string;
  url?: string;
  label?: string;
};

const fetchImageFile = async (imageUrl: string, signal: AbortSignal): Promise<File | null> => {
  const response = await fetch(imageUrl, { credentials: "include", signal });

  if (!response.ok) {
    return null;
  }

  return new File([await response.blob()], getShareFileName(imageUrl), { type: "image/png" });
};

type PreparedShare = {
  title: string;
  text: string;
  url?: string | undefined;
  file: File | null;
};

const prepareShare = ({ title, text, url }: ShareButtonProps, file: File | null): PreparedShare => ({
  file,
  text,
  title,
  url: url ? new URL(url, window.location.origin).href : undefined,
});

const shareFile = ({ file, text, title }: PreparedShare): Promise<void> =>
  navigator.share({ files: file ? [file] : [], text, title });

const shareLink = ({ text, title, url }: PreparedShare): Promise<void> =>
  navigator.share({ text, title, ...(url && { url }) });

const copyToClipboard = async ({ text, url }: PreparedShare): Promise<void> => {
  await navigator.clipboard.writeText(buildClipboardText(text, url));
  toast.success("Copied to clipboard");
};

const sharers = { clipboard: copyToClipboard, files: shareFile, link: shareLink };

const showShareError = (): void => {
  toast.error("Sorry, we couldn't share that");
};

const handleShareError = async (error: unknown, prepared: PreparedShare): Promise<void> => {
  if (isAbortError(error)) {
    return;
  }

  if (isNotAllowedError(error)) {
    await copyToClipboard(prepared).catch(showShareError);

    return;
  }

  showShareError();
};

// navigator.share must start synchronously inside the tap handler (iOS Safari drops the user activation across an
// await), so everything async, like fetching the image, has to be finished before this is called.
const shareSafely = async (props: ShareButtonProps, file: File | null): Promise<void> => {
  const prepared = prepareShare(props, file);
  const method = chooseShareMethod({
    canShare: typeof navigator.share === "function",
    canShareFiles: !!file && !!navigator.canShare?.({ files: [file] }),
    fileReady: !!file,
  });

  try {
    await sharers[method](prepared);
    hapticTap();
  } catch (error) {
    await handleShareError(error, prepared);
  }
};

type ReadyImage = { url: string; file: File };

// Starts loading the card and returns the cleanup that cancels it.
const startImagePrefetch = (imageUrl: string, onReady: (image: ReadyImage) => void): (() => void) => {
  const controller = new AbortController();

  fetchImageFile(imageUrl, controller.signal)
    .then((file) => file && onReady({ file, url: imageUrl }))
    .catch(() => undefined);

  return () => controller.abort();
};

// Fetches the card ahead of the tap so the share can start synchronously when tapped.
const usePrefetchedImage = (imageUrl?: string): File | null => {
  const [ready, setReady] = useState<ReadyImage | null>(null);

  // react-doctor-disable-next-line no-fetch-in-effect -- the card is a same-origin, per-user PNG that must be ready before the tap, because navigator.share cannot await it
  useEffect(() => (imageUrl ? startImagePrefetch(imageUrl, setReady) : undefined), [imageUrl]);

  return ready && ready.url === imageUrl ? ready.file : null;
};

const ShareButton: FC<ShareButtonProps> = (props) => {
  const [isPending, startTransition] = useTransition();
  const file = usePrefetchedImage(props.imageUrl);
  const label = props.label ?? "Share";
  const handleClick = () => startTransition(() => shareSafely(props, file));

  return (
    <Button aria-label={label} disabled={isPending} onClick={handleClick} size="sm" variant="outline">
      {isPending ? <PiSpinnerGapBold className="animate-spin" /> : <PiShareNetworkDuotone />}
      {label}
    </Button>
  );
};

export default ShareButton;
