import type { FieldValues, Resolver, SubmitErrorHandler } from "react-hook-form";
import { toast } from "sonner";

export const processFormErrors: SubmitErrorHandler<FieldValues> = (errors) => {
  console.debug("Error(s) from form:", errors);
  toast.error("Form failed validation", {
    description: "Please check the information you are submitting",
  });
};

// arktypeResolver's inferred return type doesn't line up with react-hook-form's Resolver<T> for
// schemas that use `.pipe(...)` coercion (input type differs from output type). Centralized here
// so the workaround exists in one place instead of being re-cast in every form that hits it.
export const toArktypeResolver = <T extends FieldValues>(resolver: unknown): Resolver<T> => resolver as Resolver<T>;
