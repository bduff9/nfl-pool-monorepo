import { FormControl, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC, ReactNode, Ref } from "react";
import type { ControllerFieldState } from "react-hook-form";

import { PaymentMethod } from "@/lib/constants";

type TextField = {
  name: string;
  onBlur: () => void;
  onChange: (...event: unknown[]) => void;
  ref: Ref<HTMLInputElement>;
  value: string;
};

type SelectField = {
  name: string;
  onBlur: () => void;
  onChange: (...event: unknown[]) => void;
  value: string;
};

type ProfileTextFieldProps = {
  autoComplete?: string;
  field: TextField;
  fieldState: ControllerFieldState;
  id: string;
  label: ReactNode;
  placeholder: string;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
};

export const ProfileTextField: FC<ProfileTextFieldProps> = ({
  autoComplete,
  field,
  fieldState,
  id,
  label,
  placeholder,
  readOnly = false,
  required = true,
  type = "text",
}) => (
  <FormItem>
    <FormLabel className={cn("h-5", required && "required")}>{label}</FormLabel>
    <FormControl>
      <Input
        {...field}
        autoComplete={autoComplete}
        className={cn(
          readOnly ? "dark:bg-transparent border-0 shadow-none" : "dark:bg-white",
          !readOnly && fieldState.error && "border-red-600",
        )}
        id={id}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
      />
    </FormControl>
    <FormMessage />
  </FormItem>
);

type ProfilePaymentTypeFieldProps = {
  field: SelectField;
  fieldState: ControllerFieldState;
};

export const ProfilePaymentTypeField: FC<ProfilePaymentTypeFieldProps> = ({ field, fieldState }) => (
  <FormItem>
    <FormLabel className="required h-5">Payment Type</FormLabel>
    <Select onValueChange={field.onChange} value={field.value}>
      <FormControl>
        <SelectTrigger
          aria-label="Payment Type"
          className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}
        >
          <SelectValue placeholder="-- Select a payment type --">{field.value}</SelectValue>
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {PaymentMethod.map((paymentMethod) => (
          <SelectItem key={paymentMethod} value={paymentMethod}>
            {paymentMethod}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <FormMessage />
  </FormItem>
);
