// An environment variable, or the fallback when it isn't set
export const fromEnv = (name: string, fallback = ""): string => process.env[name] ?? fallback;
