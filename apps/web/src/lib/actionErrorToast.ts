"use client";

import { toast } from "sonner";

export const onActionError = ({ error }: { error: { serverError?: string | undefined } }): void => {
  toast.error("Something went wrong!", {
    description:
      typeof error.serverError === "string" ? error.serverError : "Please check the information you are submitting.",
  });
};
