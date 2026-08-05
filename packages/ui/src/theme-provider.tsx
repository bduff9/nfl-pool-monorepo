"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, FC } from "react";

const ThemeProvider: FC<ComponentProps<typeof NextThemesProvider>> = ({ children, ...props }) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
);

export { ThemeProvider };
