"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const resolvedTheme: ToasterProps["theme"] = theme === "light" || theme === "dark" ? theme : "system";

  return (
    <Sonner
      className="toaster group"
      mobileOffset={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={resolvedTheme}
      {...props}
    />
  );
};

export { Toaster };
