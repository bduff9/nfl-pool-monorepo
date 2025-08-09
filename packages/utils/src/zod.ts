import { z } from "zod";

import { WEEKS_IN_SEASON } from "./constants";

export const weekSchema = z.number().int().min(1).max(WEEKS_IN_SEASON);
