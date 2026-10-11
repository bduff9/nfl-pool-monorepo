"use client";
import "client-only";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { catchError, type ErrorInfo } from "next/error";
import { useEffect } from "react";

type Props = {
  title: string;
};

// A failed section shows this in its own place, so the rest of the page keeps working
const SectionErrorFallback = ({ title }: Props, { error, retry }: ErrorInfo) => {
  useEffect(() => {
    console.error(`Failed to load ${title}:`, error);
  }, [error, title]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground">This couldn&apos;t be loaded right now.</p>
      <Button onClick={retry} variant="outline">
        Try again
      </Button>
    </div>
  );
};

const SectionError = catchError(SectionErrorFallback);

export default SectionError;
