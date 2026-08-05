import {
  columnFilteringFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

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
