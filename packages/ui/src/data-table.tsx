"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  flexRender,
  type RowData,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { type } from "arktype";
import { parseAsIndex, parseAsInteger, parseAsJson, useQueryState, useQueryStates } from "nuqs";
import { type ChangeEvent, type HTMLAttributes, type ReactNode, useCallback } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";

import { Button } from "./button";
import { type DataTableFeatures, dataTableFeatures } from "./data-table-features";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

const WEEKS_IN_SEASON = 18;

// Filtering is resolved server-side (manualFiltering), so this is never called. It only stops TanStack from warning
// that the auto-detected filter function is not registered when a column filter is set.
const manualFilterFn = () => true;

const paginationParsers = {
  pageIndex: parseAsIndex.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
};

export type { DataTableFeatures };

const sortingSchema = type({
  desc: "boolean",
  id: "string",
}).array();

const parseSorting = (value: unknown) => {
  const result = sortingSchema(value);
  if (result instanceof type.errors) throw new Error(result.summary);
  return result;
};

const filterSchema = type({
  id: "string",
  value: "unknown",
}).array();

const parseFilters = (value: unknown): ColumnFiltersState => {
  const result = filterSchema(value);
  if (result instanceof type.errors) throw new Error(result.summary);
  return result;
};

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
  urlKeys?: {
    filter?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
  };
}

const DEFAULT_URL_KEYS = {
  filter: "filter",
  page: "page",
  pageSize: "pageSize",
  sort: "sort",
};

export function DataTable<TData extends RowData, TValue>({
  columns,
  columnVisibility = {},
  data,
  defaultSort = [],
  filters = [],
  hidePagination = false,
  rowCount,
  urlKeys = DEFAULT_URL_KEYS,
}: DataTableProps<TData, TValue>) {
  const {
    filter: urlFilter = "filter",
    page: urlPage = "page",
    pageSize: urlPageSize = "pageSize",
    sort: urlSort = "sort",
  } = urlKeys;
  const paginationUrlKeys = {
    pageIndex: urlPage,
    pageSize: urlPageSize,
  };
  const [pagination, setPagination] = useQueryStates(paginationParsers, {
    history: "push",
    shallow: false,
    urlKeys: paginationUrlKeys,
  });
  const [sorting, setSorting] = useQueryState<SortingState>(
    urlSort,
    parseAsJson(parseSorting).withDefault(defaultSort).withOptions({
      history: "push",
      shallow: false,
    }),
  );
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
    defaultColumn: { filterFn: manualFilterFn },
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

  const {
    handleDropdownFilterChange,
    handleFirstPage,
    handleLastPage,
    handleNextPage,
    handlePageSizeChange,
    handlePreviousPage,
    handleTextFilterChange,
    handleWeekFilterChange,
  } = useDataTableHandlers(table);

  return (
    <>
      <DataTableFilters
        filters={filters}
        onDropdownFilterChange={handleDropdownFilterChange}
        onTextFilterChange={handleTextFilterChange}
        onWeekFilterChange={handleWeekFilterChange}
        table={table}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <DataTableHead table={table} />
          <DataTableBody colSpan={columns.length} table={table} />
        </Table>
      </div>

      {!hidePagination && (
        <DataTablePagination
          onFirstPage={handleFirstPage}
          onLastPage={handleLastPage}
          onNextPage={handleNextPage}
          onPageSizeChange={handlePageSizeChange}
          onPreviousPage={handlePreviousPage}
          table={table}
        />
      )}
    </>
  );
}

type DataTableInstance<TData extends RowData> = ReturnType<typeof useTable<DataTableFeatures, TData>>;

type DataTableFilter = NonNullable<DataTableProps<RowData, unknown>["filters"]>[number];

const useDataTableHandlers = <TData extends RowData>(table: DataTableInstance<TData>) => {
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

  return {
    handleDropdownFilterChange,
    handleFirstPage,
    handleLastPage,
    handleNextPage,
    handlePageSizeChange,
    handlePreviousPage,
    handleTextFilterChange,
    handleWeekFilterChange,
  };
};

type DataTableFiltersProps<TData extends RowData> = {
  filters: DataTableFilter[];
  onDropdownFilterChange: (field: string, value: string) => void;
  onTextFilterChange: (field: string, value: string) => void;
  onWeekFilterChange: (field: string, value: string) => void;
  table: DataTableInstance<TData>;
};

const DataTableFilters = <TData extends RowData>({
  filters,
  onDropdownFilterChange,
  onTextFilterChange,
  onWeekFilterChange,
  table,
}: DataTableFiltersProps<TData>) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center pb-4 gap-4">
      {filters.map((filter) => (
        <DataTableFilterControl
          filter={filter}
          key={filter.field}
          onDropdownFilterChange={onDropdownFilterChange}
          onTextFilterChange={onTextFilterChange}
          onWeekFilterChange={onWeekFilterChange}
          value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}
        />
      ))}
    </div>
  );
};

type DataTableFilterControlProps = {
  filter: DataTableFilter;
  onDropdownFilterChange: (field: string, value: string) => void;
  onTextFilterChange: (field: string, value: string) => void;
  onWeekFilterChange: (field: string, value: string) => void;
  value: string;
};

const DataTableFilterControl = ({
  filter,
  onDropdownFilterChange,
  onTextFilterChange,
  onWeekFilterChange,
  value,
}: DataTableFilterControlProps) => {
  if (filter.type === "week") {
    return (
      <WeekFilterSelect
        field={filter.field}
        onFilterChange={onWeekFilterChange}
        placeholder={filter.placeholder}
        value={value}
      />
    );
  }

  if (filter.type === "dropdown") {
    return (
      <DropdownFilterSelect
        field={filter.field}
        onFilterChange={onDropdownFilterChange}
        options={filter.options}
        placeholder={filter.placeholder}
        value={value}
      />
    );
  }

  return (
    <TextFilterInput
      field={filter.field}
      onFilterChange={onTextFilterChange}
      placeholder={filter.placeholder}
      value={value}
    />
  );
};

const DataTableHead = <TData extends RowData>({ table }: { table: DataTableInstance<TData> }) => (
  <TableHeader>
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead className="text-black" key={header.id}>
            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
);

const DataTableBody = <TData extends RowData>({
  colSpan,
  table,
}: {
  colSpan: number;
  table: DataTableInstance<TData>;
}) => {
  const rows = table.getRowModel().rows;

  return (
    <TableBody>
      {rows?.length ? (
        rows.map((row) => (
          <TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell className="h-24 text-center" colSpan={colSpan}>
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
};

type DataTablePaginationProps<TData extends RowData> = {
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (value: string) => void;
  onPreviousPage: () => void;
  table: DataTableInstance<TData>;
};

const DataTablePagination = <TData extends RowData>({
  onFirstPage,
  onLastPage,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  table,
}: DataTablePaginationProps<TData>) => (
  <div className="flex flex-wrap gap-x-2 mt-6 items-center">
    <Button aria-label="First page" disabled={!table.getCanPreviousPage()} onClick={onFirstPage}>
      {"<<"}
    </Button>
    <Button aria-label="Previous page" disabled={!table.getCanPreviousPage()} onClick={onPreviousPage}>
      {"<"}
    </Button>
    <span className="text-nowrap">{`Page ${table.state.pagination.pageIndex + 1} of ${table.getPageCount()}`}</span>
    <Button aria-label="Next page" disabled={!table.getCanNextPage()} onClick={onNextPage}>
      {">"}
    </Button>
    <Button aria-label="Last page" disabled={!table.getCanNextPage()} onClick={onLastPage}>
      {">>"}
    </Button>
    <Select onValueChange={onPageSizeChange} value={table.state.pagination.pageSize.toString()}>
      <SelectTrigger aria-label="Rows per page">
        <SelectValue placeholder="Rows per page">{table.state.pagination.pageSize}</SelectValue>
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
);

type WeekFilterSelectProps = {
  field: string;
  onFilterChange: (field: string, value: string) => void;
  placeholder: string;
  value: string;
};

const WeekFilterSelect = ({ field, onFilterChange, placeholder, value }: WeekFilterSelectProps) => {
  const handleValueChange = useCallback((value: string) => onFilterChange(field, value), [field, onFilterChange]);

  const displayValue = value === "_ALL_" ? "All weeks" : value ? `Week ${value}` : undefined;

  return (
    <Select onValueChange={handleValueChange} value={value}>
      <SelectTrigger aria-label={placeholder}>
        <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
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
  const displayValue = value === "_ALL_" ? placeholder : options.find((option) => option.value === value)?.label;

  return (
    <Select onValueChange={handleValueChange} value={value}>
      <SelectTrigger aria-label={placeholder}>
        <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
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
      aria-label={placeholder}
      className="max-w-sm"
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
  "use no memo";

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
