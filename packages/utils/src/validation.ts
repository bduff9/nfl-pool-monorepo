import { type } from "arktype";

import { WEEKS_IN_SEASON } from "./constants";

export const weekSchema = type(`1 <= number.integer <= ${WEEKS_IN_SEASON}`);
