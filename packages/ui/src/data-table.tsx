"use client"

import { cn } from "@nfl-pool-monorepo/utils/styles";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  parseAsIndex,
  parseAsInteger,
  parseAsJson,
  useQueryState,
  useQueryStates
} from 'nuqs';
import { type HTMLAttributes, type ReactNode } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";
import { z } from "zod";

import { Button } from "./button";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const WEEKS_IN_SEASON = 18;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: { field: string; placeholder: string; type: 'text' | 'week' }[]
  hidePagination?: boolean;
	rowCount: number;
  urlFilter?: string;
  urlPage?: string;
  urlPageSize?: string;
  urlSort?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filters = [],
  hidePagination = false,
	rowCount,
  urlFilter = 'filter',
  urlPage = 'page',
  urlPageSize = 'pageSize',
  urlSort = 'sort',
}: DataTableProps<TData, TValue>) {
  const paginationParsers = {
    pageIndex: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(10)
  };
  const paginationUrlKeys = {
    pageIndex: urlPage,
    pageSize: urlPageSize,
  };
  const [pagination, setPagination] = useQueryStates(paginationParsers, {
    history: 'push',
    shallow: false,
    urlKeys: paginationUrlKeys,
  });
  const sortingSchema = z.array(z.object({
    desc: z.boolean(),
    id: z.string(),
  }));
	const [sorting, setSorting] = useQueryState<SortingState>(urlSort, parseAsJson(sortingSchema.parse).withDefault([]).withOptions({
    history: 'push',
    shallow: false,
  }));
  const filterSchema = z.array(z.object({
    id: z.string(),
    value: z.unknown(),
  }).transform(o => ({ id: o.id, value: o.value as unknown })));
  const [columnFilters, setColumnFilters] = useQueryState<ColumnFiltersState>(urlFilter, parseAsJson(filterSchema.parse).withDefault([]).withOptions({
    history: 'push',
    shallow: false,
  }));

  const table = useReactTable({
    columns,
    data,
    enableColumnResizing: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
		manualPagination: true,
    onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		rowCount,
		state: {
			columnFilters,
			pagination,
			sorting,
		},
  })

  return (
		<>
      <div className="flex items-center pb-4 gap-4">
        {filters.map(filter => {
          if (filter.type === 'week') {
          return(
          <Select key={filter.field} onValueChange={value => {
            if (value === 'ALL') {
              table.getColumn(filter.field)?.setFilterValue(null)
            } else {
              table.getColumn(filter.field)?.setFilterValue(value)
            }
          }} value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}>
            <SelectTrigger className="dark:bg-white">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All weeks</SelectItem>
              {Array.from({ length: WEEKS_IN_SEASON }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <SelectItem key={i} value={(i + 1).toString()}>
                  Week {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      );
          }

          return(
            <Input
            className="max-w-sm dark:bg-white"
            key={filter.field}
            onChange={(event) =>
              table.getColumn(filter.field)?.setFilterValue(event.target.value)
            }
            placeholder={filter.placeholder}
            type="text"
            value={(table.getColumn(filter.field)?.getFilterValue() as string) ?? ""}
            />
            );
      })}
    </div>

    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead className="text-black" key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
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
    <div className="flex gap-x-2 mt-6 items-center">
        <Button
      disabled={!table.getCanPreviousPage()}
      onClick={() => table.firstPage()}
    >
      {'<<'}
    </Button>
    <Button
      disabled={!table.getCanPreviousPage()}
      onClick={() => table.previousPage()}
    >
      {'<'}
    </Button>

    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}

    <Button
      disabled={!table.getCanNextPage()}
      onClick={() => table.nextPage()}
    >
      {'>'}
    </Button>
    <Button
      disabled={!table.getCanNextPage()}
      onClick={() => table.lastPage()}
    >
      {'>>'}
    </Button>

    <Select value={table.getState().pagination.pageSize.toString()}>
      <SelectTrigger className="dark:bg-white">
        <SelectValue placeholder="Rows per page" />
      </SelectTrigger>
      <SelectContent>
      {[10, 25, 50, 100].map(pageSize => (
        <SelectItem key={pageSize} value={pageSize.toString()}>
          {pageSize}
        </SelectItem>
      ))}</SelectContent>
    </Select>
    </div>
    )}
   </>
  )
}

type SortableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
} & HTMLAttributes<HTMLDivElement>;

export const SortableColumnHeader = <T, D>({
  className,
  column,
  title,
}: SortableColumnHeaderProps<T, D>): ReactNode => {
  const toggleSort = () => {
    const sortState = column.getIsSorted();

    if (!sortState) {
      column.toggleSorting(false);
    } else if (sortState === 'asc') {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  };

  return (
    <Button
      className={cn(
        'group h-auto cursor-pointer whitespace-pre-line text-wrap break-words p-0 text-left dark:hover:bg-transparent',
        className,
      )}
      onClick={toggleSort}
      type="button"
      variant="ghost"
    >
      {title}
      {!column.getIsSorted() && <LuArrowUpDown className="ml-2 size-4 shrink-0" />}
      {column.getIsSorted() === 'asc' && <LuArrowUp className="ml-2 size-4 shrink-0" />}
      {column.getIsSorted() === 'desc' && <LuArrowDown className="ml-2 size-4 shrink-0" />}
    </Button>
  );
};
