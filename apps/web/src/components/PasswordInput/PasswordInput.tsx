import { FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { createElement, type FC, useState } from "react";
import type { ControllerFieldState, ControllerRenderProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { LuEye, LuEyeOff } from "react-icons/lu";

import FloatingLabelInput from "../FloatingLabelInput/FloatingLabelInput";
import { getPasswordFieldAttributes } from "./passwordFieldAttributes";

type Props = {
  isLogin: boolean;
  label: string;
  name: string;
  required?: boolean;
};

type PasswordVisibilityToggleProps = {
  isVisible: boolean;
  label: string;
  onToggle: () => void;
};

const PasswordVisibilityToggle: FC<PasswordVisibilityToggleProps> = ({ isVisible, label, onToggle }) => (
  <button
    aria-label={label}
    className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
    onClick={onToggle}
    type="button"
  >
    {createElement(isVisible ? LuEyeOff : LuEye, {
      className: "size-6",
    })}
  </button>
);

const PasswordInput: FC<Props> = ({ isLogin, label, name, required = false }) => {
  const { control } = useFormContext();
  const [passwordVisibility, setPasswordVisibility] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisibility((shown) => !shown);
  };

  const { autoComplete, inputType, toggleLabel } = getPasswordFieldAttributes(isLogin, passwordVisibility);

  const renderPasswordField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps;
    fieldState: ControllerFieldState;
  }) => (
    <FormItem>
      <FormControl>
        <div className="relative">
          <FloatingLabelInput
            {...field}
            aria-invalid={!!fieldState.error}
            autoComplete={autoComplete}
            className={cn("pr-12", fieldState.error && "border-red-600")}
            id={name}
            label={label}
            placeholder=" "
            required={required}
            title={label}
            type={inputType}
          />
          <PasswordVisibilityToggle
            isVisible={passwordVisibility}
            label={toggleLabel}
            onToggle={togglePasswordVisibility}
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return <FormField control={control} name={name} render={renderPasswordField} />;
};

export default PasswordInput;
