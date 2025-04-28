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

import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";

const SupportLoader: FC = async () => {
  return (
    <div className="h-100 row">
      <div className="content-bg text-dark m-3 pt-5 pt-md-3 min-vh-100 pb-3 col" id="top">
        <div className="form-floating mb-2">
          <Skeleton className="form-control" />
        </div>
        <h2 className="text-center mb-0" id="rules">
          Rules
        </h2>
        <hr />
        <ol>
          {Array.from({ length: 10 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Index is only key we have available
            <li className="mb-3" key={i}>
              <Skeleton className="h-6 w-96 bg-gray-300" />
            </li>
          ))}
        </ol>
        <h2 className="text-center mb-0" id="faq">
          FAQ
        </h2>
        <hr />
        <h3>
          <Skeleton className="h-6 w-96 bg-gray-300" />
        </h3>
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Index is only key we have available
          <details className="text-green-600 ms-7 mb-3" key={`faq-${i}`}>
            <summary className="text-black -ms-5">
              <Skeleton className="h-6 w-96 bg-gray-300" />
            </summary>
            <Skeleton className="h-6 w-96 bg-gray-300" />
          </details>
        ))}
        <h2 className="text-center mb-0" id="contact">
          Contact Us
        </h2>
        <hr />
        <div className="text-center">
          <Skeleton className="h-6 w-96 bg-gray-300" />
          <br />
          <br />
          <Skeleton className="h-6 w-96 bg-gray-300" />
          <br />
          <Skeleton className="h-6 w-96 bg-gray-300" />
          <br />
          <br />
        </div>
      </div>
    </div>
  );
};

export default SupportLoader;
