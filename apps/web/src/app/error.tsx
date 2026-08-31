"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";

import Image from "next/image";
import { type FC, useEffect, useState } from "react";

import CustomHeadClient from "@/components/CustomHead/CustomHead.client";
import PageSidebarTrigger from "@/components/PageContent/PageSidebarTrigger.client";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
};

const ErrorPage: FC<Props> = ({ error, reset, retry }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    console.error("Error message:", error);
  }, [error]);

  // react-doctor-disable-next-line no-fetch-in-effect -- error.tsx must be a client component per Next.js's error boundary contract, so this can't move to a Server Component
  useEffect(() => {
    const loadErrorData = async () => {
      try {
        const response = await fetch("/api/error");

        if (response.ok) {
          const { image, isLoggedIn } = await response.json();

          setImage(image);
          setIsLoggedIn(isLoggedIn);
        } else {
          console.error(`Failed to load error page data: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("Failed to load error page data:", fetchError);
      }

      setIsLoading(false);
    };

    loadErrorData();
  }, []);

  return (
    <div className="flex flex-col md:mx-3">
      {!!isLoggedIn && (
        <div className="w-full px-1 pt-1">
          <PageSidebarTrigger />
        </div>
      )}
      <CustomHeadClient alerts={[]} title="Error Occurred" />
      <div className="bg-muted/80 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-sm px-3 py-6 w-full md:w-1/2">
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
          <Button className="text-sky-600 text-4xl" onClick={retry} variant="link">
            Please try again
          </Button>
        </div>
        <div className="text-center mb-2">
          <Button className="text-sky-600" onClick={reset} variant="link">
            Still broken? Reset the page
          </Button>
        </div>
        {!isLoading && (
          <>
            <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2 text-center">or</h3>
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
