import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import { FaCloudUploadAlt, FaRedo, FaSave } from "react-icons/fa";
import type { IconType } from "react-icons/lib";
import { PiFootballDuotone, PiRobotDuotone } from "react-icons/pi";

import type { AutoPickStrategy } from "@/lib/constants";

import type { LoadingType } from "./MakePicksClient";

type ActionLabelProps = {
  icon: IconType;
  isLoading: boolean;
  label: string;
  loadingLabel: string;
};

const ActionLabel: FC<ActionLabelProps> = ({ icon: Icon, isLoading, label, loadingLabel }) =>
  isLoading ? (
    <>
      <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
      {loadingLabel}
    </>
  ) : (
    <>
      <div className="md:block hidden">
        <Icon />
      </div>
      {label}
    </>
  );

type PickActionsBarProps = {
  loading: LoadingType | null;
  onAutoPick: (type: (typeof AutoPickStrategy)[number]) => void;
  onResetClick: () => void;
  onSave: () => void;
  onSubmitClick: () => void;
  picksUpdating: boolean;
  sidebarOpen: boolean;
};

export const PickActionsBar: FC<PickActionsBarProps> = ({
  loading,
  onAutoPick,
  onResetClick,
  onSave,
  onSubmitClick,
  picksUpdating,
  sidebarOpen,
}) => {
  const disabled = loading !== null || picksUpdating;

  const onAutoPickAway = () => onAutoPick("Away");
  const onAutoPickHome = () => onAutoPick("Home");
  const onAutoPickRandom = () => onAutoPick("Random");

  return (
    <div
      className={cn(
        "fixed flex justify-around content-center bottom-0 end-0 w-full h-[70px] z-[49] bg-black",
        sidebarOpen ? "md:w-[calc(100%-16rem)]" : "md:w-full",
      )}
    >
      <div className="w-1/4 px-1 md:px-2">
        <Button className="w-full my-3" disabled={disabled} onClick={onResetClick} type="button" variant="danger">
          <ActionLabel icon={FaRedo} isLoading={loading === "reset"} label="Reset" loadingLabel="Resetting..." />
        </Button>
      </div>
      <div className="w-1/4 px-1 md:px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="text-nowrap w-full my-3"
              disabled={disabled}
              id="auto-pick-button"
              type="button"
              variant="secondary"
            >
              <ActionLabel
                icon={PiRobotDuotone}
                isLoading={loading === "autopick"}
                label="Auto Pick"
                loadingLabel="Picking..."
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onAutoPickAway}>Away</DropdownMenuItem>
              <DropdownMenuItem onClick={onAutoPickHome}>Home</DropdownMenuItem>
              <DropdownMenuItem onClick={onAutoPickRandom}>Random</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-1/4 px-1 md:px-2">
        <Button className="w-full my-3" disabled={disabled} onClick={onSave} type="button" variant="primary">
          <ActionLabel icon={FaSave} isLoading={loading === "save"} label="Save" loadingLabel="Saving..." />
        </Button>
      </div>
      <div className="w-1/4 px-1 md:px-2">
        <Button className="w-full my-3" disabled={disabled} onClick={onSubmitClick} type="button" variant="success">
          <ActionLabel
            icon={FaCloudUploadAlt}
            isLoading={loading === "submit"}
            label="Submit"
            loadingLabel="Submitting..."
          />
        </Button>
      </div>
    </div>
  );
};
