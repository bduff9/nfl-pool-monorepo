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
import { type ControllerRenderProps, type SubmitHandler, type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { processFormErrors } from "@/lib/form-errors";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  error: string | undefined;
};

type Step = "email" | "otp";

type EmailFormValues = typeof forgotPasswordEmailSchema.infer;
type OtpFormValues = typeof verifyOtpSchema.infer;

type EmailStepProps = {
  form: UseFormReturn<EmailFormValues>;
  isPending: boolean;
  onSubmit: SubmitHandler<EmailFormValues>;
};

const EmailStep: FC<EmailStepProps> = ({ form, isPending, onSubmit }) => {
  const renderEmailField = ({ field }: { field: ControllerRenderProps<EmailFormValues, "email"> }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="email"
          disabled={isPending}
          id="email"
          label="Email"
          type="email"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <p className="text-center text-muted-foreground mb-4">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>

        <FormField control={form.control} name="email" render={renderEmailField} />

        {!!form.formState.errors.root && (
          <div className="text-red-600 text-sm text-center" role="alert">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button className="w-full h-11" disabled={isPending} type="submit">
          {isPending ? "Sending..." : "Send Verification Code"}
        </Button>
      </form>
    </Form>
  );
};

type OtpStepProps = {
  email: string;
  form: UseFormReturn<OtpFormValues>;
  isPending: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<OtpFormValues>;
};

const OtpStep: FC<OtpStepProps> = ({ email, form, isPending, onBack, onSubmit }) => {
  const renderOtpField = ({ field }: { field: ControllerRenderProps<OtpFormValues, "otp"> }) => (
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

  const renderNewPasswordField = ({ field }: { field: ControllerRenderProps<OtpFormValues, "newPassword"> }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="new-password"
          disabled={isPending}
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
    field: ControllerRenderProps<OtpFormValues, "confirmPassword">;
  }) => (
    <FormItem>
      <FormControl>
        <FloatingLabelInput
          autoComplete="new-password"
          disabled={isPending}
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

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <p className="text-center text-muted-foreground mb-4">
          Enter the 6-digit verification code sent to <strong>{email}</strong>
        </p>

        <FormField control={form.control} name="otp" render={renderOtpField} />

        <FormField control={form.control} name="newPassword" render={renderNewPasswordField} />

        <FormField control={form.control} name="confirmPassword" render={renderConfirmPasswordField} />

        {!!form.formState.errors.root && (
          <div className="text-red-600 text-sm text-center" role="alert">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Resetting..." : "Reset Password"}
          </Button>

          <Button className="w-full" disabled={isPending} onClick={onBack} type="button" variant="outline">
            Use Different Email
          </Button>
        </div>
      </form>
    </Form>
  );
};

const ForgotPasswordForm: FC<Props> = ({ error }) => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm<EmailFormValues>({
    defaultValues: {
      email: "",
    },
    resolver: arktypeResolver(forgotPasswordEmailSchema),
  });

  const otpForm = useForm<OtpFormValues>({
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
      router.push("/", { transitionTypes: ["nav-fade"] });
    },
  });

  const handleEmailSubmit: SubmitHandler<EmailFormValues> = (data) => {
    executeSendOTP(data);
  };

  const handleOtpSubmit: SubmitHandler<OtpFormValues> = (data) => {
    executeVerifyOTP(data);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setEmail("");
    otpForm.reset();
  };

  if (step === "email") {
    return <EmailStep form={emailForm} isPending={isSendingOTP} onSubmit={handleEmailSubmit} />;
  }

  return (
    <OtpStep
      email={email}
      form={otpForm}
      isPending={isVerifyingOTP}
      onBack={handleBackToEmail}
      onSubmit={handleOtpSubmit}
    />
  );
};

export default ForgotPasswordForm;
