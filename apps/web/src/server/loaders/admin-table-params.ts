import type { type } from "arktype";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import { coerceNumber, parseJsonParam } from "./param-parsing";

type PageSize = number | "all";
type Schema<T> = (data: unknown) => T | type.errors;
type Pageable<Q> = { limit: (limit: number) => Q; offset: (offset: number) => Q };

type AdminTableConfig<Sort, Filter> = {
  defaultSort: Sort;
  filterSchema: Schema<Filter>;
  maxPageSize?: number;
  sortSchema: Schema<Sort>;
};

export const parseAdminTableParams = <Sort, Filter>(
  params: Record<string, unknown> | undefined,
  { defaultSort, filterSchema, maxPageSize = Number.POSITIVE_INFINITY, sortSchema }: AdminTableConfig<Sort, Filter>,
) => {
  const raw = params ?? {};
  const pageSize: PageSize =
    raw.pageSize === "all" ? "all" : Math.min(coerceNumber(raw.pageSize, DEFAULT_PAGE_SIZE), maxPageSize);

  return {
    filter: parseJsonParam(raw.filter, filterSchema, [] as unknown as Filter),
    page: coerceNumber(raw.page, 1),
    pageSize,
    sort: parseJsonParam(raw.sort, sortSchema, defaultSort),
  };
};

const getPageWindow = (page: number, pageSize: PageSize, allLimit: number | undefined) => {
  if (pageSize !== "all") {
    return { limit: pageSize, offset: (Math.max(page, 1) - 1) * pageSize };
  }

  return allLimit === undefined ? undefined : { limit: allLimit, offset: 0 };
};

/** Applies limit/offset for the requested page. `allLimit` caps "all"; leave it undefined for no limit. */
export const paginate = <Q extends Pageable<Q>>(query: Q, page: number, pageSize: PageSize, allLimit?: number): Q => {
  const window = getPageWindow(page, pageSize, allLimit);

  return window ? query.limit(window.limit).offset(window.offset) : query;
};

/** Runs the count and page queries together and returns the shape every admin table loader exposes. */
export const fetchTablePage = async <Row>(
  countQuery: { executeTakeFirstOrThrow: () => Promise<{ count: null | number | undefined }> },
  rowsQuery: { execute: () => Promise<Row[]> },
) => {
  const [count, results] = await Promise.all([countQuery.executeTakeFirstOrThrow(), rowsQuery.execute()]);

  return { count: count.count ?? 0, results };
};
