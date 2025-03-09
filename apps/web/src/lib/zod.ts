import { z } from "zod";
import { WEEKS_IN_SEASON } from "./constants";

export const serverActionResultSchema = z.object({
  error: z.string(),
  metadata: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  status: z.enum(["Error", "Success", "Unset"]),
});

export type ServerActionResult = z.infer<typeof serverActionResultSchema>;

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().optional(),
    isLogin: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isLogin) {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["password"],
          message: "Passwords do not match",
        });
      }
    }
  });

export const weekSchema = z.number().min(1).max(WEEKS_IN_SEASON);
