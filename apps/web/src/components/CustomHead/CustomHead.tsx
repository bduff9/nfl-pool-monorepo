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
import type { FC } from "react";
import { useContext, useEffect } from "react";

import { TitleContext } from "@/lib/context";

type CustomHeadProps = {
  title: string;
};

const CustomHead: FC<CustomHeadProps> = ({ title }) => {
  //FIXME: Do we want to bring in alerts here?  Will prob need to make this a server component and then render a child client component for the title
  const [, setTitle] = useContext(TitleContext);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only update based on title
  useEffect(() => {
    setTitle(title);
  }, [title]);

  return null;
};

export default CustomHead;
