import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import type { ReactElement } from 'react'
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
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <table className={s.table}>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className={s.headerRow}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort()
              const sorted  = header.column.getIsSorted()
              return (
                <th
                  key={header.id}
                  className={`${s.th} ${canSort ? s.thSortable : ''}`}
                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  aria-sort={
                    sorted === 'asc' ? 'ascending'
                    : sorted === 'desc' ? 'descending'
                    : canSort ? 'none'
                    : undefined
                  }
                >
                  <span className={s.thInner}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && (
                      <span className={s.sortIcon} aria-hidden>
                        {sorted === 'asc'  ? <ChevronUp  size={12} /> :
                         sorted === 'desc' ? <ChevronDown size={12} /> :
                         <ChevronsUpDown size={12} className={s.sortIconIdle} />}
                      </span>
                    )}
                  </span>
                </th>
              )
            })}
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
