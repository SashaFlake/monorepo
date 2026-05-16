import type { ReactElement } from 'react'
import { useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/shared/ui'
import type { RoutingRule } from '../../domain/types'
import { DeleteRuleDialog } from '../DeleteRuleDialog/DeleteRuleDialog'
import { DataTable } from '@/shared/table/DataTable'
import styles from './RulesTable.module.css'

type Props = {
  rules: RoutingRule[]
  onEdit: (rule: RoutingRule) => void
  onDelete: (id: string) => void
  isPending?: boolean
}

const col = createColumnHelper<RoutingRule>()

export function RulesTable({ rules, onEdit, onDelete, isPending = false }: Props): ReactElement {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const confirmRule = rules.find(r => r.id === confirmId)

  const columns = [
    col.accessor('name', {
      header: 'Name',
    }),
    col.accessor('priority', {
      header: 'Priority',
      cell: ({ getValue }) => (
        <span className={styles.tdMono}>{getValue()}</span>
      ),
    }),
    col.accessor(row => row.match.pathPrefix ?? '\u2014', {
      id: 'match',
      header: 'Match',
      cell: ({ getValue }) => (
        <span className={styles.tdMono}>{getValue()}</span>
      ),
    }),
    col.accessor('destinations', {
      header: 'Destinations',
      cell: ({ getValue }) => (
        <div className={styles.destinations}>
          {getValue().map((d, i) => (
            <span key={i} className={styles.destChip}>
              {d.version || 'default'} {d.weightPct}%
            </span>
          ))}
        </div>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className={styles.tdActions}>
          <Button variant='ghost' onClick={() => onEdit(row.original)} aria-label={`Edit rule ${row.original.name}`}>
            <Pencil size={14} />
          </Button>
          <Button variant='ghost' onClick={() => setConfirmId(row.original.id)} aria-label={`Delete rule ${row.original.name}`}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    }),
  ]

  if (rules.length === 0) {
    return (
      <div role='status' style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        No routing rules yet. Click \u201cNew rule\u201d to create one.
      </div>
    )
  }

  return (
    <>
      <DataTable data={rules} columns={columns} />

      {confirmRule && (
        <DeleteRuleDialog
          rule={confirmRule}
          isPending={isPending}
          onConfirm={() => { onDelete(confirmRule.id); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  )
}
