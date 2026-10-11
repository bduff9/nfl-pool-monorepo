type GoogleButtonTitleOptions = {
  isLinked?: boolean | undefined;
  isRegister?: boolean | undefined;
  isSignIn?: boolean | undefined;
};

export const getGoogleButtonTitle = ({ isLinked, isRegister, isSignIn }: GoogleButtonTitleOptions): string => {
  if (isSignIn) {
    return isRegister ? "Register with Google" : "Sign in with Google";
  }

  return isLinked ? "Google linked" : "Link Google account";
};
