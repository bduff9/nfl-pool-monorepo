import { FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { createElement, type FC, useCallback, useState } from "react";
import type { ControllerFieldState, ControllerRenderProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { LuEye, LuEyeOff } from "react-icons/lu";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";

type Props = {
  isLogin: boolean;
  label: string;
  name: string;
  required?: boolean;
};

const PasswordInput: FC<Props> = ({ isLogin, label, name, required = false }) => {
  const { control } = useFormContext();
  const [passwordVisibility, setPasswordVisibility] = useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setPasswordVisibility((shown) => !shown);
  }, []);

  const renderPasswordField = useCallback(
    ({ field, fieldState }: { field: ControllerRenderProps; fieldState: ControllerFieldState }) => (
      <FormItem>
        <FormControl>
          <div className="relative">
            <FloatingLabelInput
              {...field}
              aria-invalid={!!fieldState.error}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className={cn("pr-12", fieldState.error && "border-red-600")}
              id={name}
              label={label}
              placeholder=" "
              required={required}
              title={label}
              type={passwordVisibility ? "text" : "password"}
            />
            <button
              className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
              onClick={togglePasswordVisibility}
              type="button"
            >
              {createElement(passwordVisibility ? LuEyeOff : LuEye, {
                className: "size-6",
              })}
            </button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [isLogin, label, name, required, passwordVisibility, togglePasswordVisibility],
  );

  return <FormField control={control} name={name} render={renderPasswordField} />;
};

export default PasswordInput;
