import { type } from "arktype";
import type { Kysely } from "kysely";

import type { DB } from "..";

type Executor = Pick<Kysely<DB>, "selectFrom">;
type PrizeParser<T> = (data: unknown) => T | type.errors;

export const systemValueQuery = (executor: Executor, name: string) =>
  executor.selectFrom("SystemValues").select("SystemValueValue").where("SystemValueName", "=", name);

const parsePrizes = <T>(parse: PrizeParser<T>, value: string, label: string, name: string): T => {
  const prizes = parse(value);

  if (prizes instanceof type.errors) {
    console.error(`Failed to parse ${label} prize amounts`, prizes, value);

    throw new Error(`Malformed ${name} value in SystemValues: ${value}`);
  }

  return prizes;
};

export const loadPrizes = async <T>(
  executor: Executor,
  name: string,
  label: string,
  parse: PrizeParser<T>,
  defaultPrizes: T,
): Promise<T> => {
  const systemValue = await systemValueQuery(executor, name).executeTakeFirst();

  if (!systemValue?.SystemValueValue) {
    return defaultPrizes;
  }

  return parsePrizes(parse, systemValue.SystemValueValue, label, name);
};
