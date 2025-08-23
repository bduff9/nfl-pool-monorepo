"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import Image from "next/image";
import { type FC, useEffect, useState } from "react";
import "client-only";

import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";

import CustomHead from "../components/CustomHead/CustomHead";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorPage: FC<Props> = ({ error, reset }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    console.error("Error message:", error);
  }, [error]);

  useEffect(() => {
    const loadErrorData = async () => {
      const response = await fetch("/api/error");
      const { image, isLoggedIn } = await response.json();

      setImage(image);
      setIsLoggedIn(isLoggedIn);
      setIsLoading(false);
    };

    loadErrorData();
  }, []);

  return (
    <div className="flex flex-wrap">
      <CustomHead title="Error Occurred" />
      <div className="bg-gray-100/80 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-dark rounded-sm text-dark px-3 py-6 w-full md:w-1/2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center mb-6">
          Flag on the play!
        </h1>
        <div className={cn("mx-auto relative min-h-[33vh]")}>
          {!!image && (
            <Image
              alt="Flag on the play"
              className="object-contain object-center"
              fill
              priority
              sizes="100vw"
              src={image}
            />
          )}
        </div>
        <h2 className="mt-6 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors mb-2 text-center">
          There has been an error.
        </h2>
        <div className="text-center mb-2">
          <Button className="text-sky-600 text-4xl" onClick={() => reset()} variant="link">
            Please try again
          </Button>
        </div>
        {!isLoading && (
          <>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2 text-center">or</h4>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-2 text-center">
              {isLoggedIn ? (
                <ProgressBarLink className="text-sky-600" href="/">
                  Click here to return to your dashboard
                </ProgressBarLink>
              ) : (
                <ProgressBarLink className="text-sky-600" href="/auth/login">
                  Click here to return to the login page
                </ProgressBarLink>
              )}
            </h2>
          </>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
