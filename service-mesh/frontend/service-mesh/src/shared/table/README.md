# `shared/table`

Reusable data table built on `@tanstack/react-table`.

## Exports

- `DataTable<TData>` — generic table with column definitions, header rows, body rows, and optional row click handling.

## Usage

```tsx
import { DataTable } from '@/shared/table/DataTable'
import { createColumnHelper } from '@tanstack/react-table'

const col = createColumnHelper<MyRow>()
const columns = [
  col.accessor('name', { header: 'Name' }),
  col.display({ id: 'actions', header: '', cell: ({ row }) => <button>Edit</button> }),
]

<DataTable data={rows} columns={columns} onRowClick={(row) => console.log(row)} />
```
