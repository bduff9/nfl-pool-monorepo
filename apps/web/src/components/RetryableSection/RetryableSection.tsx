"use client";

/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import "client-only";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { catchError, type ErrorInfo } from "next/error";

type FallbackProps = {
  title: string;
};

const SectionErrorFallback = (props: FallbackProps, { retry }: ErrorInfo) => {
  return (
    <div className="w-full text-center py-8">
      <p className="mb-2">Couldn&apos;t load {props.title}. This is usually temporary.</p>
      <Button className="text-sky-600" onClick={retry} variant="link">
        Try again
      </Button>
    </div>
  );
};

const RetryableSection = catchError(SectionErrorFallback);

export default RetryableSection;
