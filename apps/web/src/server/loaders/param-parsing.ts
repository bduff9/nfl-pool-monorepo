import { type } from "arktype";

export function parseJsonParam<T>(value: unknown, schema: (data: unknown) => T | type.errors, defaultValue: T): T {
  if (value == null || value === "") return defaultValue;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const result = schema(parsed);
    if (result instanceof type.errors) return defaultValue;
    return result;
  } catch {
    return defaultValue;
  }
}

export function coerceNumber(value: unknown, defaultValue: number): number {
  if (value == null) return defaultValue;
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}
