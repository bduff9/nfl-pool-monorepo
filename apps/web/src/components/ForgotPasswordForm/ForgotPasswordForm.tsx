"use client";

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@nfl-pool-monorepo/ui/components/input-otp";

import { formatError } from "@/lib/auth.client";
import { forgotPasswordEmailSchema, verifyOtpSchema } from "@/lib/validation";
import { sendPasswordResetOTP, verifyOTPAndResetPassword } from "@/server/actions/user";
import "client-only";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FC, useEffect, useRef, useState } from "react";
import { type ControllerRenderProps, type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { processFormErrors } from "@/lib/form-errors";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  error: string | undefined;
};

type Step = "email" | "otp";

const ForgotPasswordForm: FC<Props> = ({ error }) => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm<typeof forgotPasswordEmailSchema.infer>({
    defaultValues: {
      email: "",
    },
    resolver: arktypeResolver(forgotPasswordEmailSchema),
  });

  const otpForm = useForm<typeof verifyOtpSchema.infer>({
    defaultValues: {
      confirmPassword: "",
      email: "",
      newPassword: "",
      otp: "",
    },
    resolver: arktypeResolver(verifyOtpSchema),
  });

  const appliedErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (error && error !== appliedErrorRef.current) {
      appliedErrorRef.current = error;

      const formatted = formatError(error);

      if (step === "email") {
        emailForm.setError("root", { message: formatted });
      } else {
        otpForm.setError("root", { message: formatted });
      }
    }
  }, [error, step, emailForm, otpForm]);

  const { execute: executeSendOTP, isPending: isSendingOTP } = useAction(sendPasswordResetOTP, {
    onError: onActionError,
    onSuccess: ({ input }) => {
      toast.success("Please check your email for the verification code.");
      emailForm.reset();
      setEmail(input.email);
      otpForm.setValue("email", input.email);
      setStep("otp");
    },
  });

  const { execute: executeVerifyOTP, isPending: isVerifyingOTP } = useAction(verifyOTPAndResetPassword, {
    onError: onActionError,
    onSuccess: () => {
      toast.success("Your password has been successfully reset");
      router.push("/");
    },
  });

  const handleEmailSubmit: SubmitHandler<typeof forgotPasswordEmailSchema.infer> = (data) => {
    executeSendOTP(data);
  };

  const handleOtpSubmit: SubmitHandler<typeof verifyOtpSchema.infer> = (data) => {
    executeVerifyOTP(data);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setEmail("");
    otpForm.reset();
  };

  const renderEmailField = ({
    field,
  }: {
    field: ControllerRenderProps<typeof forgotPasswordEmailSchema.infer, "email">;
  }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="email"
          disabled={isSendingOTP}
          id="email"
          label="Email"
          placeholder="Email"
          type="email"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderOtpField = ({ field }: { field: ControllerRenderProps<typeof verifyOtpSchema.infer, "otp"> }) => (
    <FormItem className="flex justify-center">
      <FormControl>
        <InputOTP aria-label="Verification code" maxLength={6} {...field}>
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
  );

  const renderNewPasswordField = ({
    field,
  }: {
    field: ControllerRenderProps<typeof verifyOtpSchema.infer, "newPassword">;
  }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="new-password"
          disabled={isVerifyingOTP}
          id="newPassword"
          label="New Password"
          placeholder=" "
          type="password"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderConfirmPasswordField = ({
    field,
  }: {
    field: ControllerRenderProps<typeof verifyOtpSchema.infer, "confirmPassword">;
  }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="new-password"
          disabled={isVerifyingOTP}
          id="confirmPassword"
          label="Confirm New Password"
          placeholder=" "
          type="password"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  if (step === "email") {
    return (
      <Form {...emailForm} key="email-form">
        <form className="space-y-4" onSubmit={emailForm.handleSubmit(handleEmailSubmit, processFormErrors)}>
          <p className="text-center text-gray-600 mb-4">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          <FormField control={emailForm.control} name="email" render={renderEmailField} />

          {!!emailForm.formState.errors.root && (
            <div className="text-red-600 text-sm text-center" role="alert">
              {emailForm.formState.errors.root.message}
            </div>
          )}

          <Button className="w-full h-11" disabled={isSendingOTP} type="submit">
            {isSendingOTP ? "Sending..." : "Send Verification Code"}
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

        <FormField control={otpForm.control} name="otp" render={renderOtpField} />

        <FormField control={otpForm.control} name="newPassword" render={renderNewPasswordField} />

        <FormField control={otpForm.control} name="confirmPassword" render={renderConfirmPasswordField} />

        {!!otpForm.formState.errors.root && (
          <div className="text-red-600 text-sm text-center" role="alert">
            {otpForm.formState.errors.root.message}
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full" disabled={isVerifyingOTP} type="submit">
            {isVerifyingOTP ? "Resetting..." : "Reset Password"}
          </Button>

          <Button
            className="w-full"
            disabled={isVerifyingOTP}
            onClick={handleBackToEmail}
            type="button"
            variant="outline"
          >
            Use Different Email
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ForgotPasswordForm;
