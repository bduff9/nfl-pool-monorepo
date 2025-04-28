import { z } from "zod";

export const env = z.object({
  AWS_AK_ID: z.string(),
  AWS_R: z.literal("us-east-1"),
  AWS_SAK_ID: z.string(),
  DATABASE_URL: z.string().url(),
  domain: z.string().url(),
  EMAIL_FROM: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
}).parse(process.env);
