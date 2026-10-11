type PasswordFieldAttributes = {
  autoComplete: "current-password" | "new-password";
  inputType: "password" | "text";
  toggleLabel: "Hide password" | "Show password";
};

export const getPasswordFieldAttributes = (isLogin: boolean, isVisible: boolean): PasswordFieldAttributes => ({
  autoComplete: isLogin ? "current-password" : "new-password",
  inputType: isVisible ? "text" : "password",
  toggleLabel: isVisible ? "Hide password" : "Show password",
});
