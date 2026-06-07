import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type RowData,
} from '@tanstack/react-table'
import type {ReactElement} from 'react'
import s from './DataTable.module.css'

/**
 * Props for {@link DataTable}.
 *
 * @template TData - Row data type, must extend TanStack Table's `RowData`
 */
type DataTableProps<TData extends RowData> = {
  /** Column definitions. */
  columns: ColumnDef<TData>[]

  /** Data rows to render. */
  data: TData[]

  /** Optional click handler invoked with the original row data. */
  onRowClick?: (row: TData) => void
}

/**
 * Reusable table built on `@tanstack/react-table`.
 *
 * Renders a simple table with headers and body rows. When `onRowClick` is
 * provided, rows receive a clickable style and cursor.
 *
 * @template TData - Row data type
 * @param columns     - Column definitions
 * @param data        - Row data
 * @param onRowClick  - Optional row click handler
 * @returns The table element
 * @sideEffects none
 */
export const DataTable = <TData extends RowData>({
                                                     data,
                                                     columns,
                                                     onRowClick,
                                                 }: DataTableProps<TData>): ReactElement => {
    const table = useReactTable<TData>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <table className={s.table}>
            <thead>
            {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={s.headerRow}>
                    {headerGroup.headers.map((header) => (
                        <th key={header.id} className={s.th}>
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                )}
                        </th>
                    ))}
                </tr>
            ))}
            </thead>

            <tbody>
            {table.getRowModel().rows.map((row) => (
                <tr
                    key={row.id}
                    className={`${s.row} ${onRowClick ? s.clickable : ''}`}
                    onClick={() => onRowClick?.(row.original)}
                >
                    {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={s.td}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    )
}
