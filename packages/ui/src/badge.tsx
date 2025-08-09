import { cn } from "@nfl-pool-monorepo/utils/styles";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        blue: "border-transparent bg-blue-600 text-white [a&]:hover:bg-blue-700",
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        primary: "border-transparent text-white bg-green-700 [a&]:hover:bg-green-800",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        success: "border-transparent text-white bg-emerald-600 [a&]:hover:bg-emerald-700",
        warning: "border-transparent bg-amber-400 text-black [a&]:hover:bg-yellow-500",
      },
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  //@ts-expect-error Refs fail here for some reason
  return <Comp className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />;
}

export { Badge, badgeVariants };
