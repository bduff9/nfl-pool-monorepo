import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import type { ReactNode } from "react";
import { PiQuestionDuotone } from "react-icons/pi";

export const teamNameLabel: ReactNode = (
  <>
    Team Name &nbsp;<span className="text-xs text-muted-foreground">(Optional)</span>
  </>
);

export const paymentAccountLabel: ReactNode = (
  <>
    Payment Account&nbsp;
    <Popover>
      <PopoverTrigger aria-label="More information about payment account" type="button">
        <PiQuestionDuotone className="size-5" />
      </PopoverTrigger>
      <PopoverContent className="max-w-[300px]">
        If you want to receive any prize money, you need to enter your exact payment account information here (i.e.
        email, username or phone number for your account).{" "}
        <strong>This is your responsibility as we will not be chasing people down to pay them.</strong> If entering
        phone number, please enter a valid phone number in the format +1 999 999 9999.
      </PopoverContent>
    </Popover>
  </>
);
