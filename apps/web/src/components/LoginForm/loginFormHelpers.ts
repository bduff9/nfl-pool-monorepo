import type { Route } from "next";

export const getPostLoginRoute = (redirectTo: unknown): Route =>
  typeof redirectTo === "string" && redirectTo ? (redirectTo as Route) : "/";

export const getLoginSubmitLabel = (isLogin: boolean, isLoginPending: boolean, isRegisterPending: boolean): string => {
  if (isLogin) {
    return isLoginPending ? "Logging in..." : "Login";
  }

  return isRegisterPending ? "Registering..." : "Register";
};
