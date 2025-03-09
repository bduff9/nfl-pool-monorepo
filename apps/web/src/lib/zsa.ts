import type { FieldValues, SubmitErrorHandler } from "react-hook-form";
import { toast } from "sonner";
import type { ZodType, ZodTypeDef } from "zod";
import type { TAnyZodSafeFunctionHandler, inferServerActionReturnType } from "zsa";

export type FormZSA = TAnyZodSafeFunctionHandler<
  // biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the FormZSA
  ZodType<any, ZodTypeDef, any>,
  // biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the FormZSA
  any
>;

export const processFormState = (
  result: inferServerActionReturnType<
    // biome-ignore lint/suspicious/noExplicitAny: We don't know the type of the FormZSA
    TAnyZodSafeFunctionHandler<ZodType<any, ZodTypeDef, any>, any>
  >,
  redirect?: () => void,
  successMessage = "Success!",
): void => {
  const [data, error] = result;

  if (error || data?.status === "Error") {
    if (error?.name === "ZodError") {
      toast.error("Something went wrong!", {
        description: "Please check the information you are submitting.",
      });
    } else {
      toast.error("Something went wrong!", {
        description: data?.error || error?.data || "Please check the information you are submitting.",
      });
    }

    return;
  }

  if (data.status === "Success") {
    toast.success(successMessage, {
      description: `${new Date().toTimeString()}`,
    });

    redirect?.();
  }
};

export const processFormErrors: SubmitErrorHandler<FieldValues> = (errors) => {
  console.debug("Error(s) from form:", errors);
  toast.error("Form failed validation", {
    description: "Please check the information you are submitting",
  });
};
