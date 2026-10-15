"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { getDialogClasses } from "./dialog-variants";
import { useKeyboardInset } from "./hooks/use-keyboard-inset";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  centered = false,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & { centered?: boolean }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(getDialogClasses(centered).overlay, className)}
      data-slot="dialog-overlay"
      {...props}
    />
  );
}

function DialogContent({
  centered = false,
  className,
  children,
  onPointerDownOutside,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  // Stays centred on phones too, instead of becoming a bottom sheet (see dialog-variants)
  centered?: boolean;
}) {
  const keyboardInset = useKeyboardInset();

  // With the keyboard up, a tap outside the sheet only puts the keyboard away, as on iOS, instead of dismissing it
  const handlePointerDownOutside = React.useCallback<NonNullable<typeof onPointerDownOutside>>(
    (event) => {
      onPointerDownOutside?.(event);

      if (keyboardInset > 0 && document.activeElement instanceof HTMLElement) {
        event.preventDefault();
        document.activeElement.blur();
      }
    },
    [keyboardInset, onPointerDownOutside],
  );

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay centered={centered} />
      <DialogPrimitive.Content
        className={cn(getDialogClasses(centered).content, className)}
        data-slot="dialog-content"
        onPointerDownOutside={handlePointerDownOutside}
        style={{ "--keyboard-inset": `${keyboardInset}px`, ...style } as React.CSSProperties}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 after:absolute after:-inset-3.5 after:content-[''] transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      data-slot="dialog-header"
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg leading-none font-semibold", className)}
      data-slot="dialog-title"
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="dialog-description"
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
