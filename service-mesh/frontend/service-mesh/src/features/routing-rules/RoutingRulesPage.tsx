// ---------------------------------------------------------------------------
// RoutingRulesPage — главная страница управления routing rules
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { routingApi, routingKeys } from './api'
import { RulesTable } from './RulesTable'
import { RuleFormModal } from './RuleFormModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { RoutingRule, RuleFormValues } from './types'

export function RoutingRulesPage() {
  const qc = useQueryClient()

  const [editRule, setEditRule]     = useState<RoutingRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<RoutingRule | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // --- Queries ---

  const { data: rules = [], isLoading, isError } = useQuery({
    queryKey: routingKeys.list(),
    queryFn: routingApi.list,
    staleTime: 10_000,
  })

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: (input: RuleFormValues) => routingApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: routingKeys.list() })
      setCreateOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RuleFormValues }) =>
      routingApi.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: routingKeys.list() })
      setEditRule(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routingApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: routingKeys.list() })
      setDeleteRule(null)
    },
  })

  // --- Render ---

  return (
    <>
      <Header
        title="Routing Rules"
        subtitle="Управление правилами маршрутизации трафика"
        action={
          <Button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Plus size={14} /> Новое правило
          </Button>
        }
      />

      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading && (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
              Загрузка правил…
            </div>
          )}
          {isError && (
            <div style={{ padding: 'var(--space-6)', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              ⚠️ Не удалось загрузить правила маршрутизации
            </div>
          )}
          {!isLoading && !isError && (
            <RulesTable
              rules={rules}
              onEdit={setEditRule}
              onDelete={setDeleteRule}
            />
          )}
        </Card>
      </main>

      {/* Create modal */}
      {createOpen && (
        <RuleFormModal
          isPending={createMutation.isPending}
          onSubmit={values => createMutation.mutate(values)}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Edit modal */}
      {editRule && (
        <RuleFormModal
          initial={editRule}
          isPending={updateMutation.isPending}
          onSubmit={values => updateMutation.mutate({ id: editRule.id, input: values })}
          onClose={() => setEditRule(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteRule && (
        <DeleteConfirmDialog
          rule={deleteRule}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteRule.id)}
          onCancel={() => setDeleteRule(null)}
        />
      )}
    </>
  )
}
