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
import { promises as fs } from "node:fs";
import path from "node:path";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import Image from "next/image";
import type { FC } from "react";

import CustomHead from "../components/CustomHead/CustomHead";

import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import Write404Log from "@/components/Write404Log/Write404Log";
import { getRandomInteger } from "@/lib/numbers";
import { getCurrentSession } from "@/server/loaders/sessions";

const NotFound: FC = async () => {
  const { user } = await getCurrentSession();
  const imagesDirectory = path.join(process.cwd(), "public", "404");
  const imageNames = await fs.readdir(imagesDirectory);
  const images = imageNames.map((image) => `/404/${image}`);
  const image = images[getRandomInteger(0, images.length)] ?? "";

  return (
    <div className="flex flex-wrap">
      <CustomHead title="404" />
      <Write404Log user={user} />
      <div className="bg-gray-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mx-3 border border-dark rounded-sm text-dark px-3 pb-6 w-full md:w-1/2">
        <h1 className="text-5xl text-center">What have you done?!</h1>
        <div className={cn("mx-auto relative h-[50vh]")}>
          {!!image && (
            <Image
              alt="Okay, this part was us."
              className="object-contain object-center"
              fill
              priority
              sizes="100vw"
              src={image}
            />
          )}
        </div>
        <h4 className="text-center text-2xl mb-2">
          Something has gone wrong. It might be because of you. It might be because of us. Either way, this is awkward.
        </h4>
        <div className="text-center">
          <ProgressBarLink href="/" className="text-sky-600">
            Please click here to get us both out of this situation
          </ProgressBarLink>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
