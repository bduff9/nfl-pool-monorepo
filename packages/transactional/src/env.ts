import { type } from "arktype";

const envSchema = type({
  AWS_AK_ID: "string",
  AWS_R: "'us-east-2'",
  AWS_SAK_ID: "string",
  DATABASE_URL: "string.url",
  domain: "string.url",
  EMAIL_FROM: "string",
  TWILIO_ACCOUNT_SID: "string",
  TWILIO_AUTH_TOKEN: "string",
  TWILIO_PHONE_NUMBER: "string",
});

const result = envSchema(process.env);
if (result instanceof type.errors) {
  throw new Error(`Invalid environment variables: ${result.summary}`);
}
export const env = result;
