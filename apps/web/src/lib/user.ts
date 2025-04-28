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
type NameProps = {
  UserName: string | null;
  UserFirstName: string | null;
  UserLastName: string | null;
};

export const getFullName = (user: NameProps): string => {
  if (user.UserName) {
    return user.UserName;
  }

  const firstName = user.UserFirstName?.trim() ?? "";
  const lastName = user.UserLastName?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`;

  return fullName.trim();
};

const getNameParts = (fullName: string): [string, string] => {
  const words = fullName.trim().split(" ");

  if (words.length === 0) {
    return ["", ""];
  }

  const [firstName, ...lastNameArr] = words;

  if (words.length === 1) {
    return [firstName ?? "", ""];
  }

  return [firstName ?? "", lastNameArr.join(" ")];
};

export const getFirstName = (user: NameProps): string => {
  if (user.UserFirstName) {
    return user.UserFirstName;
  }

  if (!user.UserName) {
    return "";
  }

  const [firstName] = getNameParts(user.UserName);

  return firstName.trim();
};

export const getLastName = (user: NameProps): string => {
  if (user.UserLastName) {
    return user.UserLastName;
  }

  if (!user.UserName) {
    return "";
  }

  const [, lastName] = getNameParts(user.UserName);

  return lastName.trim();
};
