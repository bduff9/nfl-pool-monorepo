"use client";

import { createContext, type Dispatch, type SetStateAction, useContext } from "react";
import "client-only";

export const HasAuthenticatedNavContext = createContext<boolean | null>(null);
export const SetHasAuthenticatedNavContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export const useHasAuthenticatedNav = (): boolean => {
  const hasNav = useContext(HasAuthenticatedNavContext);

  if (hasNav === null) {
    throw new Error("useHasAuthenticatedNav must be used within an AuthenticatedNavPresenceProvider.");
  }

  return hasNav;
};
