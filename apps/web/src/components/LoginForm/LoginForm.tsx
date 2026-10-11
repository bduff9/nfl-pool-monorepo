"use client";

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { onActionError } from "@/lib/actionErrorToast";
import { formatError } from "@/lib/auth.client";
import { processFormErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/validation";
import { login, register } from "@/server/actions/user";
import "client-only";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FC, useEffect } from "react";
import type { ControllerProps } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";
import PasswordInput from "../PasswordInput/PasswordInput";
import TextSeparator from "../TextSeparator/TextSeparator";
import { WeekLink } from "../WeekLink/WeekLink";
import { getLoginSubmitLabel, getPostLoginRoute } from "./loginFormHelpers";

type Props = {
  error: string | undefined;
  isLogin: boolean;
};

const renderEmailField: ControllerProps<typeof loginSchema.infer, "email">["render"] = ({ field }) => (
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
);

type LoginFormActionsProps = {
  isLogin: boolean;
  isLoginPending: boolean;
  isRegisterPending: boolean;
};

const LoginFormActions: FC<LoginFormActionsProps> = ({ isLogin, isLoginPending, isRegisterPending }) => (
  <div className="grid gap-2 mb-2">
    <Button disabled={isLoginPending || isRegisterPending} type="submit" variant="primary">
      {getLoginSubmitLabel(isLogin, isLoginPending, isRegisterPending)}
    </Button>
    {!!isLogin && (
      <Button asChild variant="outline">
        <WeekLink href="/auth/forgot-password">Forgot Password?</WeekLink>
      </Button>
    )}
    <Button asChild variant="dark">
      <WeekLink href="/support#loginregistration">{isLogin ? "Trouble logging in?" : "Trouble registering?"}</WeekLink>
    </Button>
    <TextSeparator>or</TextSeparator>
  </div>
);

const LoginForm: FC<Props> = ({ error, isLogin }) => {
  const router = useRouter();
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
    // react-doctor-disable-next-line exhaustive-deps -- form.setValue is a stable RHF method; only isLogin should retrigger this
  }, [isLogin]);

  const { execute: executeLogin, isPending: isLoginPending } = useAction(login, {
    onError: onActionError,
    onSuccess: ({ data }) => {
      toast.success("Successfully logged in!");
      router.push(getPostLoginRoute(data?.metadata?.redirectTo));
    },
  });

  const { execute: executeRegister, isPending: isRegisterPending } = useAction(register, {
    onError: onActionError,
    onSuccess: ({ data }) => {
      toast.success("Successfully registered!");
      router.push(getPostLoginRoute(data?.metadata?.redirectTo));
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
      <form method="post" onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        {!!error && (
          <div className={cn("text-center mb-3")} id="errorMessage">
            {formatError(error)}
          </div>
        )}
        <div className="mb-2">
          <FormField control={form.control} name="email" render={renderEmailField} />
        </div>
        <div className="mb-2">
          <PasswordInput isLogin={isLogin} label="Password" name="password" required />
        </div>
        {!isLogin && (
          <div className="mb-2">
            <PasswordInput isLogin={false} label="Confirm Password" name="confirmPassword" required />
          </div>
        )}
        <LoginFormActions isLogin={isLogin} isLoginPending={isLoginPending} isRegisterPending={isRegisterPending} />
      </form>
    </Form>
  );
};

export default LoginForm;
