"use client";
import "client-only";

import { useRouter } from "next/navigation";
import type { FC, FormEventHandler, ReactNode } from "react";

type HeadToHeadFormProps = {
  children: ReactNode;
  className?: string;
};

// A plain GET form, so it still works before the page's script has loaded. Once it has, the comparison is a client
// navigation that crossfades the matchup in place instead of reloading the whole document.
const HeadToHeadForm: FC<HeadToHeadFormProps> = ({ children, className }) => {
  const router = useRouter();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const query = new URLSearchParams();

    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") query.append(key, value);
    }

    // matchup-swap: the page itself stays, so its scrim is left in the page (see globals.css)
    router.push(`/head-to-head?${query.toString()}`, { scroll: false, transitionTypes: ["nav-fade", "matchup-swap"] });
  };

  return (
    <form className={className} method="get" onSubmit={handleSubmit}>
      {children}
    </form>
  );
};

export default HeadToHeadForm;
