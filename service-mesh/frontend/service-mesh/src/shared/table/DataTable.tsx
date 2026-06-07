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
    columns: ColumnDef<TData>[]
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
