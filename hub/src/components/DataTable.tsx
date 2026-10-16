import { createSortedRowModel, rowSortingFeature, sortFn_alphanumeric, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cx } from "./ui";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});
export type Features = typeof features;
export type Columns<T extends RowData> = ColumnDef<Features, T, any>[];

/**
 * Sortable, accessible table. Filtering is done by the page (pass already-filtered `data`).
 * Rows are activated with a real button in the first cell so keyboard users can open details.
 */
export function DataTable<T extends RowData>({
  data,
  columns,
  caption,
  rowKey,
  onActivate,
  activeKey,
  maxHeight = "70dvh",
}: {
  data: T[];
  columns: Columns<T>;
  caption: ReactNode;
  rowKey: (row: T) => string;
  onActivate?: (row: T) => void;
  activeKey?: string | null;
  maxHeight?: string;
}) {
  const table = useTable({ features, columns, data, getRowId: (r: T) => rowKey(r) });
  return (
    <div className="table-wrap" style={{ maxBlockSize: maxHeight }}>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((g) => (
            <tr key={g.id}>
              {g.headers.map((h) => {
                const sorted = h.column.getIsSorted();
                const canSort = h.column.getCanSort();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                  >
                    {canSort ? (
                      <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 font-semibold hover:text-primary-strong">
                        <table.FlexRender header={h} />
                        <span aria-hidden="true" className="text-xs text-muted">
                          {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                        </span>
                      </button>
                    ) : (
                      <table.FlexRender header={h} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onActivate ? () => onActivate(row.original) : undefined}
              className={cx(
                onActivate && "cursor-pointer transition-colors hover:bg-surface-2",
                activeKey === row.id && "bg-primary-soft",
              )}
            >
              {row.getAllCells().map((cell) => (
                <td key={cell.id} data-label={typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : undefined}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-muted">
                No rows match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
