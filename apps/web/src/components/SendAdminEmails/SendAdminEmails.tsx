"use client";

/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { type FC, useCallback, useEffect, useEffectEvent, useState } from "react";

import "quill/dist/quill.bubble.css";

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useAction } from "next-safe-action/hooks";
import type { Control, ControllerFieldState, ControllerRenderProps, SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { PiFootballDuotone } from "react-icons/pi";
import { useQuill } from "react-quilljs";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { AdminEmailTo, AdminEmailType } from "@/lib/constants";
import { processFormErrors } from "@/lib/form-errors";
import { sendAdminEmailSchema } from "@/lib/validation";
import { sendAdminEmail } from "@/server/actions/email";

import PreviewAdminEmail from "../PreviewAdminEmail/PreviewAdminEmail";
import { getPartialFailureDescription } from "./partialFailure";

const quillModules = {
  clipboard: {
    // toggle to add extra line breaks when pasting HTML:
    matchVisual: false,
  },
  toolbar: [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block", "code"],

    // [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ],
};

const quillFormats = [
  "align",
  "background",
  "blockquote",
  "bold",
  "code",
  "code-block",
  "color",
  "direction",
  "font",
  "header",
  "image",
  "indent",
  "italic",
  "link",
  "list",
  "script",
  "size",
  "strike",
  "underline",
  "video",
];

type SendAdminEmailFieldRenderProps<TName extends keyof typeof sendAdminEmailSchema.infer> = {
  field: ControllerRenderProps<typeof sendAdminEmailSchema.infer, TName>;
  fieldState: ControllerFieldState;
};

type BodyFieldProps = {
  hasError: boolean;
  onBlur: () => void;
  onBodyChange: (html: string) => void;
};

// The editor and its ref live here, not in the form's render callback, so React Compiler can still optimize the form
const BodyField: FC<BodyFieldProps> = ({ hasError, onBlur, onBodyChange }) => {
  const { quill, quillRef } = useQuill({
    bounds: "#quill-container",
    formats: quillFormats,
    modules: quillModules,
    placeholder: "Intriguing email content",
    theme: "bubble",
  });

  const handleBodyChange = useEffectEvent((html: string) => onBodyChange(html));

  useEffect(() => {
    if (quill) {
      quill.on("text-change", () => {
        handleBodyChange(quill.root.innerHTML);
      });
    }

    return () => {
      if (quill) {
        quill.off("text-change");
      }
    };
  }, [quill]);

  return (
    <FormItem className="mt-3">
      <FormLabel className="required">Body</FormLabel>
      <FormControl>
        <div className={cn("bg-white border rounded-md w-full min-h-10", hasError && "border-red-600")}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: This div should be interactive */}
          <div onBlur={onBlur} ref={quillRef} />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const renderEmailTypeField = ({ field, fieldState }: SendAdminEmailFieldRenderProps<"emailType">) => (
  <FormItem>
    <FormLabel className="required">Which email?</FormLabel>
    <FormControl>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger aria-label="Which email?" className={cn("w-full", fieldState.error && "border-red-600")}>
          <SelectValue placeholder="-- Select an email type --">{field.value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AdminEmailType.map((emailType) => (
            <SelectItem key={`email-type-${emailType}`} value={emailType}>
              {emailType}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
    <FormMessage />
  </FormItem>
);

const renderSendToField = ({ field, fieldState }: SendAdminEmailFieldRenderProps<"sendTo">) => (
  <FormItem>
    <FormLabel className="required">Send to</FormLabel>
    <FormControl>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger aria-label="Send to" className={cn("w-full", fieldState.error && "border-red-600")}>
          <SelectValue placeholder="-- Select send to group --">{field.value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AdminEmailTo.map((sendTo) => (
            <SelectItem key={`send-to-${sendTo}`} value={sendTo}>
              {sendTo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
    <FormMessage />
  </FormItem>
);

const renderUserEmailField = ({ field, fieldState }: SendAdminEmailFieldRenderProps<"userEmail">) => (
  <FormItem>
    <FormLabel className="required">Email</FormLabel>
    <FormControl>
      <Input
        {...field}
        aria-invalid={!!fieldState.error}
        autoComplete="email"
        className={cn(fieldState.error && "border-red-600")}
        id="userEmail"
        placeholder="someone@email.com"
        type="email"
        value={field.value ?? ""}
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

const renderUserFirstNameField = ({ field, fieldState }: SendAdminEmailFieldRenderProps<"userFirstName">) => (
  <FormItem>
    <FormLabel className="required">First name</FormLabel>
    <FormControl>
      <Input
        {...field}
        aria-invalid={!!fieldState.error}
        autoComplete="given-name"
        className={cn(fieldState.error && "border-red-600")}
        id="userFirstName"
        placeholder="John"
        type="text"
        value={field.value ?? ""}
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

type PreviewTextFieldProps = {
  field: ControllerRenderProps<typeof sendAdminEmailSchema.infer, "preview" | "subject">;
  fieldState: ControllerFieldState;
  label: string;
  onBlur: () => void;
  placeholder: string;
};

const PreviewTextField: FC<PreviewTextFieldProps> = ({ field, fieldState, label, onBlur, placeholder }) => (
  <FormItem>
    <FormLabel className="required">{label}</FormLabel>
    <FormControl>
      <Input
        {...field}
        aria-invalid={!!fieldState.error}
        autoComplete="off"
        className={cn(fieldState.error && "border-red-600")}
        onBlur={onBlur}
        placeholder={placeholder}
        type="text"
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

type NewUserFieldsProps = {
  control: Control<typeof sendAdminEmailSchema.infer>;
};

const NewUserFields: FC<NewUserFieldsProps> = ({ control }) => (
  <>
    <FormField control={control} name="userEmail" render={renderUserEmailField} />

    <FormField control={control} name="userFirstName" render={renderUserFirstNameField} />
  </>
);

type SubmitButtonProps = {
  isPending: boolean;
};

const SubmitButton: FC<SubmitButtonProps> = ({ isPending }) => (
  <div className="w-full md:col-span-2 grid">
    <Button disabled={isPending} type="submit" variant="primary">
      {isPending ? (
        <>
          <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
          Sending...
        </>
      ) : (
        "Send Email"
      )}
    </Button>
  </div>
);

type CustomEmailFieldsProps = {
  control: Control<typeof sendAdminEmailSchema.infer>;
  emailType: (typeof AdminEmailType)[number];
  onBodyChange: (html: string) => void;
  onPreviewBlur: () => void;
  previewPayload: { body: string; preview: string; subject: string };
  userFirstName: string | null | undefined;
};

const CustomEmailFields: FC<CustomEmailFieldsProps> = ({
  control,
  emailType,
  onBodyChange,
  onPreviewBlur,
  previewPayload,
  userFirstName,
}) => {
  const renderSubjectField = useCallback(
    ({ field, fieldState }: SendAdminEmailFieldRenderProps<"subject">) => (
      <PreviewTextField
        field={field}
        fieldState={fieldState}
        label="Subject"
        onBlur={onPreviewBlur}
        placeholder="Interesting email subject"
      />
    ),
    [onPreviewBlur],
  );

  const renderPreviewField = useCallback(
    ({ field, fieldState }: SendAdminEmailFieldRenderProps<"preview">) => (
      <PreviewTextField
        field={field}
        fieldState={fieldState}
        label="Preview"
        onBlur={onPreviewBlur}
        placeholder="Helpful email preview text"
      />
    ),
    [onPreviewBlur],
  );

  const renderBodyField = useCallback(
    ({ fieldState }: SendAdminEmailFieldRenderProps<"body">) => (
      <BodyField hasError={!!fieldState.error} onBlur={onPreviewBlur} onBodyChange={onBodyChange} />
    ),
    [onBodyChange, onPreviewBlur],
  );

  return (
    <>
      <div className="grid">
        <FormField control={control} name="subject" render={renderSubjectField} />

        <FormField control={control} name="preview" render={renderPreviewField} />

        <FormField control={control} name="body" render={renderBodyField} />
      </div>

      <PreviewAdminEmail emailType={emailType} payload={previewPayload} userFirstName={userFirstName ?? "USER"} />
    </>
  );
};

const SendAdminEmails: FC = () => {
  "use no memo";

  const form = useForm<typeof sendAdminEmailSchema.infer>({
    defaultValues: {
      body: "",
      preview: "",
      subject: "",
      userEmail: null,
      userFirstName: null,
    },
    resolver: arktypeResolver(sendAdminEmailSchema),
  });
  const emailType = useWatch({ control: form.control, name: "emailType" });
  const sendTo = useWatch({ control: form.control, name: "sendTo" });
  const subject = useWatch({ control: form.control, name: "subject" });
  const preview = useWatch({ control: form.control, name: "preview" });
  const body = useWatch({ control: form.control, name: "body" });
  const userFirstName = useWatch({ control: form.control, name: "userFirstName" });
  const [previewPayload, setPreviewPayload] = useState({ body, preview, subject });
  const { executeAsync, isPending } = useAction(sendAdminEmail, {
    onError: onActionError,
    onSuccess: ({ data }) => {
      const failureDescription = getPartialFailureDescription(data?.metadata);

      if (failureDescription) {
        toast.warning("Email partially sent", { description: failureDescription });
      } else {
        toast.success("Successfully sent email!");
      }

      form.reset();
    },
  });

  const updatePreview = useCallback((): void => {
    setPreviewPayload({ body, preview, subject });
  }, [body, preview, subject]);

  const onSubmit: SubmitHandler<typeof sendAdminEmailSchema.infer> = (values) => {
    const toastId = toast.loading("Sending email...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });

    return executeAsync(values).finally(() => toast.dismiss(toastId));
  };

  const setBody = useCallback((html: string) => form.setValue("body", html), [form.setValue]);

  return (
    <div className="flex flex-col" id="quill-container">
      <div className="w-full bg-muted/80 text-foreground p-4 border rounded">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center mb-6">Send Email</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="emailType" render={renderEmailTypeField} />

              <FormField control={form.control} name="sendTo" render={renderSendToField} />

              {sendTo === "New" && <NewUserFields control={form.control} />}

              {emailType === "Custom" && (
                <CustomEmailFields
                  control={form.control}
                  emailType={emailType}
                  onBodyChange={setBody}
                  onPreviewBlur={updatePreview}
                  previewPayload={previewPayload}
                  userFirstName={userFirstName}
                />
              )}

              <SubmitButton isPending={isPending} />
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SendAdminEmails;
