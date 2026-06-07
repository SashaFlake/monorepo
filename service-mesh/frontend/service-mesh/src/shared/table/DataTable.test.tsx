import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface Row {
  name: string
  age: number
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
]

const data: Row[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
  })

  it('renders rows', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('applies clickable cursor when onRowClick is provided', () => {
    render(<DataTable columns={columns} data={data} onRowClick={vi.fn()} />)
    const rows = screen.getAllByRole('row').slice(1) // skip header
    expect(rows[0].className).toContain('clickable')
  })

  it('does not apply clickable cursor when onRowClick is omitted', () => {
    render(<DataTable columns={columns} data={data} />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0].className).not.toContain('clickable')
  })

  it('calls onRowClick with row data on click', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />)
    const rows = screen.getAllByRole('row').slice(1)
    fireEvent.click(rows[0])
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })
})
