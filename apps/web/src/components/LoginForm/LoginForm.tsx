"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";
import { redirect } from "next/navigation";
import { type FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";
import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import TextSeparator from "../TextSeparator/TextSeparator";

import { formatError } from "@/lib/auth.client";
import { loginSchema } from "@/lib/zod";
import { processFormErrors, processFormState } from "@/lib/zsa";
import { login, register } from "@/server/actions/users";

type Props = {
  error: string | undefined;
  isLogin: boolean;
};

const LoginForm: FC<Props> = ({ error, isLogin }) => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      confirmPassword: "",
      email: "",
      isLogin,
      password: "",
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only need to run on isLogin change
  useEffect(() => {
    form.setValue("isLogin", isLogin);
  }, [isLogin]);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    const result = await (isLogin ? login(values) : register(values));
    const redirectTo = result[0]?.metadata.redirectTo;

    processFormState(
      result,
      () => {
        redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/");
      },
      isLogin ? "Successfully logged in!" : "Successfully registered!",
    );
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    {...field}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    id="password"
                    label="Password"
                    placeholder=" "
                    required
                    title="Password"
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {!isLogin && (
          <div className="mb-2">
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingLabelInput
                      {...field}
                      autoComplete="new-password"
                      id="confirmPassword"
                      label="Confirm Password"
                      placeholder=" "
                      required
                      title="Confirm Password"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <div className="grid gap-2 mb-2">
          <Button type="submit" disabled={form.formState.isSubmitting} variant="primary">
            {isLogin
              ? form.formState.isSubmitting
                ? "Logging in..."
                : "Login"
              : form.formState.isSubmitting
                ? "Registering..."
                : "Register"}
          </Button>
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
