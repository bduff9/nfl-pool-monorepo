"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@nfl-pool-monorepo/ui/components/input-otp";

import { formatError } from "@/lib/auth.client";
import { forgotPasswordEmailSchema, verifyOtpSchema } from "@/lib/zod";
import { sendPasswordResetOTP, verifyOTPAndResetPassword } from "@/server/actions/user";
import "client-only";

import { redirect } from "next/navigation";
import { type FC, useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import type { z } from "zod";

import { processFormErrors, processFormState } from "@/lib/zsa";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  error: string | undefined;
};

type Step = "email" | "otp";

const ForgotPasswordForm: FC<Props> = ({ error }) => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<z.infer<typeof forgotPasswordEmailSchema>>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordEmailSchema),
  });

  const otpForm = useForm<z.infer<typeof verifyOtpSchema>>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      newPassword: "",
      otp: "",
    },
    resolver: zodResolver(verifyOtpSchema),
  });

  useEffect(() => {
    if (error) {
      const formatted = formatError(error);
      if (step === "email") {
        emailForm.setError("root", { message: formatted });
      } else {
        otpForm.setError("root", { message: formatted });
      }
    }
  }, [error, step, emailForm, otpForm]);

  const handleEmailSubmit: SubmitHandler<z.infer<typeof forgotPasswordEmailSchema>> = async (data) => {
    setIsLoading(true);

    try {
      const result = await sendPasswordResetOTP(data);

      processFormState(
        result,
        () => {
          emailForm.reset();
          setEmail(data.email);
          // Always proceed to OTP step even if email doesn't exist (security)
          otpForm.setValue("email", data.email);
          setStep("otp");
        },
        "Please check your email for the verification code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit: SubmitHandler<z.infer<typeof verifyOtpSchema>> = async (data) => {
    setIsLoading(true);

    try {
      const result = await verifyOTPAndResetPassword(data);

      processFormState(
        result,
        () => {
          // Redirect to dashboard on success (user is auto-logged in)
          redirect("/");
        },
        "Your password has been successfully reset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setEmail("");
    otpForm.reset();
  };

  if (step === "email") {
    return (
      <Form {...emailForm} key="email-form">
        <form className="space-y-4" onSubmit={emailForm.handleSubmit(handleEmailSubmit, processFormErrors)}>
          <p className="text-center text-gray-600 mb-4">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    autoComplete="email"
                    disabled={isLoading}
                    id="email"
                    label="Email"
                    placeholder="Email"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {emailForm.formState.errors.root && (
            <div className="text-red-600 text-sm text-center">{emailForm.formState.errors.root.message}</div>
          )}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...otpForm} key="otp-form">
      <form className="space-y-4" onSubmit={otpForm.handleSubmit(handleOtpSubmit, processFormErrors)}>
        <p className="text-center text-gray-600 mb-4">
          Enter the 6-digit verification code sent to <strong>{email}</strong>
        </p>

        <FormField
          control={otpForm.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex justify-center">
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={otpForm.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  autoComplete="new-password"
                  disabled={isLoading}
                  id="newPassword"
                  label="New Password"
                  placeholder=" "
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={otpForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FloatingLabelInput
                  autoComplete="new-password"
                  disabled={isLoading}
                  id="confirmPassword"
                  label="Confirm New Password"
                  placeholder=" "
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {otpForm.formState.errors.root && (
          <div className="text-red-600 text-sm text-center">{otpForm.formState.errors.root.message}</div>
        )}

        <div className="space-y-2">
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>

          <Button className="w-full" disabled={isLoading} onClick={handleBackToEmail} type="button" variant="outline">
            Use Different Email
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ForgotPasswordForm;
