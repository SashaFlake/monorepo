import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type RowData,
} from '@tanstack/react-table'
import type {ReactElement} from 'react'
import s from './DataTable.module.css'

type DataTableProps<TData extends RowData> = {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<TData, any>[]
    data: TData[]
    onRowClick?: (row: TData) => void
}

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
                    className={s.row}
                    onClick={() => onRowClick?.(row.original)}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
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
