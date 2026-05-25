"use client";

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { formatError } from "@/lib/auth.client";
import { processFormErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/validation";
import { login, register } from "@/server/actions/user";
import "client-only";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";
import PasswordInput from "../PasswordInput/PasswordInput";
import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import TextSeparator from "../TextSeparator/TextSeparator";

type Props = {
  error: string | undefined;
  isLogin: boolean;
};

const LoginForm: FC<Props> = ({ error, isLogin }) => {
  const form = useForm<typeof loginSchema.infer>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      isLogin,
      password: "",
    },
    resolver: arktypeResolver(loginSchema),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only need to run on isLogin change
  useEffect(() => {
    form.setValue("isLogin", isLogin);
  }, [isLogin]);

  const { execute: executeLogin, isPending: isLoginPending } = useAction(login, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: ({ data }) => {
      const redirectTo = data?.metadata?.redirectTo;
      toast.success("Successfully logged in!");
      redirect(typeof redirectTo === "string" && redirectTo ? (redirectTo as Route) : "/");
    },
  });

  const { execute: executeRegister, isPending: isRegisterPending } = useAction(register, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSuccess: ({ data }) => {
      const result = data as { metadata?: Record<string, boolean | number | string>; status?: string };
      const redirectTo = result?.metadata?.redirectTo;
      toast.success("Successfully registered!");
      redirect(typeof redirectTo === "string" && redirectTo ? (redirectTo as Route) : "/");
    },
  });

  const onSubmit = (values: typeof loginSchema.infer) => {
    if (isLogin) {
      executeLogin(values);
    } else {
      executeRegister(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        {!!error && (
          <div className={cn("text-center mb-3")} id="errorMessage">
            {formatError(error)}
          </div>
        )}
        <div className="mb-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    {...field}
                    autoComplete="email"
                    id="email"
                    label="Email address"
                    placeholder=" "
                    required
                    title="Email Address"
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="mb-2">
          <PasswordInput isLogin={isLogin} label="Password" name="password" required />
        </div>
        {!isLogin && (
          <div className="mb-2">
            <PasswordInput isLogin={false} label="Confirm Password" name="confirmPassword" required />
          </div>
        )}
        <div className="grid gap-2 mb-2">
          <Button disabled={isLoginPending || isRegisterPending} type="submit" variant="primary">
            {isLogin ? (isLoginPending ? "Logging in..." : "Login") : isRegisterPending ? "Registering..." : "Register"}
          </Button>
          {isLogin && (
            <Button asChild variant="outline">
              <ProgressBarLink href="/auth/forgot-password">Forgot Password?</ProgressBarLink>
            </Button>
          )}
          <Button asChild variant="dark">
            <ProgressBarLink href="/support#loginregistration">
              {isLogin ? "Trouble logging in?" : "Trouble registering?"}
            </ProgressBarLink>
          </Button>
          <TextSeparator>or</TextSeparator>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
