import type { ReactNode } from "react";
import type { FieldValues, SubmitErrorHandler } from "react-hook-form";
import { toast } from "sonner";
import type { z, ZodType, ZodTypeDef } from "zod";
import type { inferServerActionReturnType, TAnyZodSafeFunctionHandler, ZSAError } from "zsa";
import type { serverActionResultSchema } from "./zod";

// biome-ignore lint/suspicious/noExplicitAny: We need to support any ZSA function
export type FormZSA<TInput extends ZodType<any, ZodTypeDef, any> = ZodType<any, ZodTypeDef, any>, TOutput extends ZodType<any, ZodTypeDef, any> = typeof serverActionResultSchema> = TAnyZodSafeFunctionHandler<
  TInput,
  TOutput,
  Promise<z.infer<TOutput>>,
  ZSAError<TInput, TOutput>
>;

export const processFormState = (
  result: inferServerActionReturnType<
    FormZSA
  >,
  redirect?: () => void,
  successMessage?: ReactNode,
): void => {
  const [data, error] = result;

  if (error) {
    if (error?.name === "ZodError") {
      toast.error("Something went wrong!", {
        description: "Please check the information you are submitting.",
      });
    } else {
      toast.error("Something went wrong!", {
        description: error?.data ? `${error.data}` : "Please check the information you are submitting.",
      });
    }

    return;
  }

  if (data.status === "Success") {
    if (successMessage) {
      toast.success(successMessage, {
        description: `${new Date().toTimeString()}`,
      });
    }

    redirect?.();
  }
};

export const processFormErrors: SubmitErrorHandler<FieldValues> = (errors) => {
  console.debug("Error(s) from form:", errors);
  toast.error("Form failed validation", {
    description: "Please check the information you are submitting",
  });
};
