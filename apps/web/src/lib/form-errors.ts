import type { FieldValues, SubmitErrorHandler } from "react-hook-form";
import { toast } from "sonner";

export const processFormErrors: SubmitErrorHandler<FieldValues> = (errors) => {
  console.debug("Error(s) from form:", errors);
  toast.error("Form failed validation", {
    description: "Please check the information you are submitting",
  });
};
