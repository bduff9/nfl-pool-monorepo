"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  flexRender,
  type RowData,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type } from "arktype";
import { parseAsIndex, parseAsInteger, parseAsJson, useQueryState, useQueryStates } from "nuqs";
import { type ChangeEvent, type HTMLAttributes, type ReactNode, useCallback } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";

import { Button } from "./button";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

const WEEKS_IN_SEASON = 18;

// All row-model resolution (filtering, sorting, pagination) is done server-side via the
// manual* options below, so no client-side row-model factories are registered here.
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
});

export type DataTableFeatures = typeof dataTableFeatures;

interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<DataTableFeatures, TData, TValue>[];
  columnVisibility?: ColumnVisibilityState;
  data: TData[];
  defaultSort?: SortingState;
  filters?: (
    | { field: string; placeholder: string; type: "text" | "week" }
    | {
        field: string;
        placeholder: string;
        type: "dropdown";
        options: { label: string; value: string }[];
      }
  )[];
  hidePagination?: boolean;
  rowCount: number;
  urlFilter?: string;
  urlPage?: string;
  urlPageSize?: string;
  urlSort?: string;
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  columnVisibility = {},
  data,
  defaultSort = [],
  filters = [],
  hidePagination = false,
  rowCount,
  urlFilter = "filter",
  urlPage = "page",
  urlPageSize = "pageSize",
  urlSort = "sort",
}: DataTableProps<TData, TValue>) {
  const paginationParsers = {
    pageIndex: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(10),
  };
  const paginationUrlKeys = {
    pageIndex: urlPage,
    pageSize: urlPageSize,
  };
  const [pagination, setPagination] = useQueryStates(paginationParsers, {
    history: "push",
    shallow: false,
    urlKeys: paginationUrlKeys,
  });
  const sortingSchema = type({
    desc: "boolean",
    id: "string",
  }).array();
  const parseSorting = (value: unknown) => {
    const result = sortingSchema(value);
    if (result instanceof type.errors) throw new Error(result.summary);
    return result;
  };
  const [sorting, setSorting] = useQueryState<SortingState>(
    urlSort,
    parseAsJson(parseSorting).withDefault(defaultSort).withOptions({
      history: "push",
      shallow: false,
    }),
  );
  const filterSchema = type({
    id: "string",
    value: "unknown",
  }).array();
  const parseFilters = (value: unknown) => {
    const result = filterSchema(value);
    if (result instanceof type.errors) throw new Error(result.summary);
    return result as ColumnFiltersState;
  };
  const [columnFilters, setColumnFilters] = useQueryState<ColumnFiltersState>(
    urlFilter,
    parseAsJson(parseFilters).withDefault([]).withOptions({
      history: "push",
      shallow: false,
    }),
  );

  const table = useTable({
    columns: columns as ColumnDef<DataTableFeatures, TData, unknown>[],
    data,
    enableColumnResizing: true,
    features: dataTableFeatures,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: (filters) => {
      setColumnFilters(filters);
      table.setPageIndex(0);
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    rowCount,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      sorting,
    },
  });

  const handleWeekFilterChange = useCallback(
    (field: string, value: string) => {
      if (value === "_ALL_") {
        table.getColumn(field)?.setFilterValue(null);
      } else {
        table.getColumn(field)?.setFilterValue(value);
      }
    },
    [table],
  );

  const handleDropdownFilterChange = useCallback(
    (field: string, value: string) => {
      if (value === "_ALL_") {
        table.getColumn(field)?.setFilterValue("");
      } else {
        table.getColumn(field)?.setFilterValue(value);
      }
    },
    [table],
  );

  const handleTextFilterChange = useCallback(
    (field: string, value: string) => {
      table.getColumn(field)?.setFilterValue(value);
    },
    [table],
  );

  const handleFirstPage = useCallback(() => table.firstPage(), [table]);
  const handlePreviousPage = useCallback(() => table.previousPage(), [table]);
  const handleNextPage = useCallback(() => table.nextPage(), [table]);
  const handleLastPage = useCallback(() => table.lastPage(), [table]);
  const handlePageSizeChange = useCallback((value: string) => table.setPageSize(parseInt(value, 10)), [table]);

  return (
    <>
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center pb-4 gap-4">
          {filters.map((filter) => {
            if (filter.type === "week") {
              return (
                <WeekFilterSelect
                  field={filter.field}
                  key={filter.field}
                  onFilterChange={handleWeekFilterChange}
                  placeholder={filter.placeholder}
                  value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}
                />
              );
            }

            if (filter.type === "dropdown") {
              return (
                <DropdownFilterSelect
                  field={filter.field}
                  key={filter.field}
                  onFilterChange={handleDropdownFilterChange}
                  options={filter.options}
                  placeholder={filter.placeholder}
                  value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}
                />
              );
            }

            return (
              <TextFilterInput
                field={filter.field}
                key={filter.field}
                onFilterChange={handleTextFilterChange}
                placeholder={filter.placeholder}
                value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}
              />
            );
          })}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="text-black" key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!hidePagination && (
        <div className="flex flex-wrap gap-x-2 mt-6 items-center">
          <Button disabled={!table.getCanPreviousPage()} onClick={handleFirstPage}>
            {"<<"}
          </Button>
          <Button disabled={!table.getCanPreviousPage()} onClick={handlePreviousPage}>
            {"<"}
          </Button>
          <span className="text-nowrap">{`Page ${table.state.pagination.pageIndex + 1} of ${table.getPageCount()}`}</span>
          <Button disabled={!table.getCanNextPage()} onClick={handleNextPage}>
            {">"}
          </Button>
          <Button disabled={!table.getCanNextPage()} onClick={handleLastPage}>
            {">>"}
          </Button>
          <Select onValueChange={handlePageSizeChange} value={table.state.pagination.pageSize.toString()}>
            <SelectTrigger className="dark:bg-white">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}

type WeekFilterSelectProps = {
  field: string;
  onFilterChange: (field: string, value: string) => void;
  placeholder: string;
  value: string;
};

const WeekFilterSelect = ({ field, onFilterChange, placeholder, value }: WeekFilterSelectProps) => {
  const handleValueChange = useCallback((value: string) => onFilterChange(field, value), [field, onFilterChange]);

  return (
    <Select onValueChange={handleValueChange} value={value}>
      <SelectTrigger aria-label={placeholder} className="dark:bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_ALL_">All weeks</SelectItem>
        {Array.from({ length: WEEKS_IN_SEASON }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: false positive
          <SelectItem key={i} value={(i + 1).toString()}>
            Week {i + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type DropdownFilterSelectProps = {
  field: string;
  onFilterChange: (field: string, value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  value: string;
};

const DropdownFilterSelect = ({ field, onFilterChange, options, placeholder, value }: DropdownFilterSelectProps) => {
  const handleValueChange = useCallback((value: string) => onFilterChange(field, value), [field, onFilterChange]);

  return (
    <Select onValueChange={handleValueChange} value={value}>
      <SelectTrigger aria-label={placeholder} className="dark:bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_ALL_">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

type TextFilterInputProps = {
  field: string;
  onFilterChange: (field: string, value: string) => void;
  placeholder: string;
  value: string;
};

const TextFilterInput = ({ field, onFilterChange, placeholder, value }: TextFilterInputProps) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onFilterChange(field, event.target.value),
    [field, onFilterChange],
  );

  return (
    <Input
      className="max-w-sm dark:bg-white"
      onChange={handleChange}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  );
};

type SortableColumnHeaderProps<TData extends RowData, TValue> = {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
} & HTMLAttributes<HTMLDivElement>;

export const SortableColumnHeader = <T extends RowData, D>({
  className,
  column,
  title,
}: SortableColumnHeaderProps<T, D>): ReactNode => {
  const toggleSort = () => {
    const sortState = column.getIsSorted();

    if (!sortState) {
      column.toggleSorting(false);
    } else if (sortState === "asc") {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  };

  return (
    <Button
      className={cn(
        "group h-auto cursor-pointer whitespace-pre-line text-wrap break-words p-0 text-left dark:hover:bg-transparent",
        className,
      )}
      onClick={toggleSort}
      type="button"
      variant="ghost"
    >
      {title}
      {!column.getIsSorted() && <LuArrowUpDown className="ml-2 size-4 shrink-0" />}
      {column.getIsSorted() === "asc" && <LuArrowUp className="ml-2 size-4 shrink-0" />}
      {column.getIsSorted() === "desc" && <LuArrowDown className="ml-2 size-4 shrink-0" />}
    </Button>
  );
};
