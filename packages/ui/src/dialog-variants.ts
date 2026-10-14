// Shared by Dialog and AlertDialog. Below md a dialog is a bottom sheet, as on iOS: it slides up from the bottom edge,
// decelerating into place (350 ms), and drops back down accelerating (250 ms), so it never lingers at the edge. It is
// rounded on top, padded clear of the home indicator, and scrolls inside when it is taller than the screen. From md up it
// stays centred and zooms in. Reduced motion shows and hides it at once. Only transform and opacity animate.
const DIALOG_OVERLAY_CLASSES =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 ease-(--ease-out-quint) data-[state=open]:duration-350 data-[state=closed]:duration-250 max-md:data-[state=closed]:ease-in md:data-[state=open]:duration-250 motion-reduce:animate-none!";

const DIALOG_CONTENT_CLASSES =
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 grid w-full gap-4 p-6 shadow-lg ease-(--ease-out-quint) motion-reduce:animate-none! max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[calc(100dvh-var(--safe-top,0px)-1rem)] max-md:overflow-y-auto max-md:rounded-t-2xl max-md:border-t max-md:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:duration-350 max-md:data-[state=closed]:duration-250 max-md:data-[state=closed]:ease-in md:top-[50%] md:left-[50%] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-lg md:border md:duration-250 md:data-[state=closed]:fade-out-0 md:data-[state=open]:fade-in-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95";

// A dialog that stays centred on phones too (the keyboard-driven command palette), with its original timing
const CENTERED_DIALOG_OVERLAY_CLASSES =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50";

const CENTERED_DIALOG_CONTENT_CLASSES =
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg";

export const getDialogClasses = (centered: boolean): { content: string; overlay: string } =>
  centered
    ? { content: CENTERED_DIALOG_CONTENT_CLASSES, overlay: CENTERED_DIALOG_OVERLAY_CLASSES }
    : { content: DIALOG_CONTENT_CLASSES, overlay: DIALOG_OVERLAY_CLASSES };
