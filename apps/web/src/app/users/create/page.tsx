import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "server-only";

import type { FC } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import FinishRegistrationForm from "@/components/FinishRegistrationForm/FinishRegistrationForm";
import PageContent from "@/components/PageContent/PageContent";
import { finishRegistration } from "@/server/actions/user";
import { getCurrentSession } from "@/server/loaders/sessions";
import { getCurrentUser, userHasGoogle } from "@/server/loaders/user";
import { getSeasonStatus } from "@/server/loaders/week";

const TITLE = "Finish Registration";

export const metadata: Metadata = {
  title: TITLE,
};

const CreateProfile: FC<PageProps<"/users/create">> = async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    return redirect("/auth/login");
  }

  if (user.doneRegistering) {
    return redirect("/users/edit");
  }

  const currentUserPromise = getCurrentUser();
  const hasGooglePromise = userHasGoogle(user.id);
  const seasonStatusPromise = getSeasonStatus();

  const [currentUser, hasGoogle, seasonStatus] = await Promise.all([
    currentUserPromise,
    hasGooglePromise,
    seasonStatusPromise,
  ]);

  return (
    <div className="h-full flex flex-col md:mx-3">
      <CustomHead title={TITLE} />
      <PageContent className="pt-5 md:pt-4 pb-6 px-3 grow shrink-0">
        <FinishRegistrationForm
          currentUser={currentUser}
          finishRegistration={finishRegistration}
          hasGoogle={hasGoogle}
          seasonStatus={seasonStatus}
        />
      </PageContent>
    </div>
  );
};

export default CreateProfile;
