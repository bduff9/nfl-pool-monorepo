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

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Form } from "@nfl-pool-monorepo/ui/components/form";

import { processFormErrors } from "@/lib/form-errors";
import { useBeforeUnload } from "@/lib/hooks/useBeforeUnload";
import { getFirstName, getFullName, getLastName } from "@/lib/user";
import { finishRegistrationSchema } from "@/lib/validation";
import type { finishRegistration } from "@/server/actions/user";
import type { getCurrentUser } from "@/server/loaders/user";
import "client-only";

import type { Status } from "@nfl-pool-monorepo/types";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { type FC, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";

import { RegistrationFields } from "./RegistrationFields";

type FinishRegistrationFormProps = {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  finishRegistration: typeof finishRegistration;
  hasGoogle: boolean;
  seasonStatus: Status;
};

const FinishRegistrationForm: FC<FinishRegistrationFormProps> = ({
  currentUser,
  finishRegistration,
  hasGoogle,
  seasonStatus,
}) => {
  const router = useRouter();
  const form = useForm<typeof finishRegistrationSchema.infer>({
    defaultValues: {
      UserEmail: currentUser.UserEmail,
      UserFirstName: getFirstName(currentUser),
      UserLastName: getLastName(currentUser),
      UserName: getFullName(currentUser),
      UserPaymentAccount: currentUser.UserPaymentAccount ?? "",
      UserPaymentType: currentUser.UserPaymentType ?? "Paypal",
      UserPlaysSurvivor: seasonStatus !== "Not Started" ? false : currentUser.UserPlaysSurvivor === 1,
      UserReferredByRaw: currentUser.UserReferredByRaw || "",
      UserTeamName: currentUser.UserTeamName || "",
    },
    resolver: arktypeResolver(finishRegistrationSchema),
  });
  const [showUntrusted, setShowUntrusted] = useState<boolean>(
    !currentUser.UserTrusted && !!currentUser.UserReferredByRaw,
  );

  const { execute, isPending } = useAction(finishRegistration, {
    onError: ({ error }) => {
      console.error("Error during finish registration submit:", error);
      toast.error("Something went wrong!", {
        description:
          typeof error.serverError === "string"
            ? error.serverError
            : "Please check the information you are submitting.",
      });
    },
    onSuccess: ({ data }) => {
      const isTrusted = data?.metadata?.isTrusted;
      setShowUntrusted(!isTrusted);
      toast.success("You have successfully submitted your registration!");
      if (isTrusted) {
        router.push("/users/payments");
      }
    },
  });

  useBeforeUnload(form.formState.isDirty);

  const onSubmit: SubmitHandler<typeof finishRegistrationSchema.infer> = (data) => {
    // Only backfill UserName from first/last name when it doesn't already look like a real
    // two-part name - this preserves a real display name (e.g. from Google) over a synthesized one.
    const hasRealName = data.UserName.match(/\w{2,}\s\w{2,}/);
    const UserName = hasRealName ? data.UserName : `${data.UserFirstName.trim()} ${data.UserLastName.trim()}`;

    execute({ ...data, UserName });
  };

  if (showUntrusted) {
    return (
      <div className="text-center">
        <h2 className="mb-4">Thanks for requesting access!</h2>
        <h2 className="mb-5">An admin will review your information and will notify you via email shortly.</h2>
      </div>
    );
  }

  const errorCount = Object.keys(form.formState.errors).length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <RegistrationFields
            control={form.control}
            errorCount={errorCount}
            hasGoogle={hasGoogle}
            isPending={isPending}
            isUntrusted={currentUser.UserTrusted !== 1}
            seasonStatus={seasonStatus}
          />
        </div>
      </form>
    </Form>
  );
};

export default FinishRegistrationForm;
