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

const LOGIN_ERROR_MESSAGES = {
  EmailSignin: "Something went wrong with the email login attempt, please try again later or contact an admin",
  InvalidEmail: "It looks like your email is not valid, please double check it and try again",
  LatePayment: "Your entry fee is past due, please pay immediately to regain access and avoid losing any points",
  MissingSystemProperty: "System error, please contact an administrator",
  NotAllowed: "Your account has been blocked.  Please reach out to an administrator to resolve.",
  OAuthAccountNotLinked:
    "It looks like you haven't linked your account yet, please sign in using the previous method and then link this account to be able to use it to sign in",
  RegistrationOver: "Sorry, registration is over for this year, please try again next season!",
} as const;

type TLoginError = keyof typeof LOGIN_ERROR_MESSAGES;

const isLoginError = (arg: unknown): arg is TLoginError =>
  typeof arg === "string" && Object.hasOwn(LOGIN_ERROR_MESSAGES, arg);

export const formatError = (error: unknown): string => (isLoginError(error) ? LOGIN_ERROR_MESSAGES[error] : "");
