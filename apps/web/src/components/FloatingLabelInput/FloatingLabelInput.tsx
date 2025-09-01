import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { ComponentProps, FC } from "react";

type Props = { label: string; id: string } & ComponentProps<"input">;

const FloatingLabelInput: FC<Props> = ({ className, label, id, ...props }) => {
  return (
    <div className="relative">
      {/* @ts-expect-error This works at runtime */}
      <input
        className={cn(
          "block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-hidden focus:ring-0 focus:border-blue-600 peer",
          className,
        )}
        id={id}
        {...props}
        placeholder=" "
      />
      <label
        className="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 dark:peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:rtl:translate-x-1/4 peer-focus:rtl:left-auto start-1 bg-gray-100 peer-placeholder-shown:bg-transparent peer-focus:bg-gray-100"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingLabelInput;
