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
import { getRandomInteger } from "@/lib/numbers";
import type { FC } from "react";
import Skeleton from "react-loading-skeleton";

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
          {new Array(10).fill(0).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Index is only key we have available
            <li className="mb-3" key={i}>
              <Skeleton count={getRandomInteger(1, 5)} />
            </li>
          ))}
        </ol>
        <h2 className="text-center mb-0" id="faq">
          FAQ
        </h2>
        <hr />
        <h3>
          <Skeleton />
        </h3>
        {new Array(3).fill(0).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Index is only key we have available
          <details className="text-success ms-7 mb-3" key={`faq-${i}`}>
            <summary className="text-dark ms-n5">
              <Skeleton />
            </summary>
            <Skeleton />
          </details>
        ))}
        <h2 className="text-center mb-0" id="contact">
          Contact Us
        </h2>
        <hr />
        <div className="text-center">
          <Skeleton />
          <br />
          <br />
          <Skeleton />
          <br />
          <Skeleton />
          <br />
          <br />
        </div>
      </div>
    </div>
  );
};

// ts-prune-ignore-next
export default SupportLoader;
