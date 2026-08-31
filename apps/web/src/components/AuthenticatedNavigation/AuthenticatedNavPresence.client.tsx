"use client";

import { type FC, type ReactNode, useContext, useLayoutEffect, useState } from "react";
import "client-only";

import { HasAuthenticatedNavContext, SetHasAuthenticatedNavContext } from "./authenticatedNavPresenceContext";

type ProviderProps = {
  children: ReactNode;
};

export const AuthenticatedNavPresenceProvider: FC<ProviderProps> = ({ children }) => {
  const [hasNav, setHasNav] = useState(false);

  return (
    <SetHasAuthenticatedNavContext.Provider value={setHasNav}>
      <HasAuthenticatedNavContext.Provider value={hasNav}>{children}</HasAuthenticatedNavContext.Provider>
    </SetHasAuthenticatedNavContext.Provider>
  );
};

export const AuthenticatedNavMarker: FC = () => {
  const setHasNav = useContext(SetHasAuthenticatedNavContext);

  useLayoutEffect(() => {
    if (!setHasNav) {
      return;
    }

    setHasNav(true);

    return () => {
      setHasNav(false);
    };
  }, [setHasNav]);

  return null;
};
