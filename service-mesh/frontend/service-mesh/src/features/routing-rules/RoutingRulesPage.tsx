import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRoutingRules } from './useRoutingRules'
import { RulesTable } from './RulesTable'
import { RuleFormModal } from './RuleFormModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

export function RoutingRulesPage() {
  const r = useRoutingRules()

  return (
    <>
      <Header
        title="Routing Rules"
        subtitle="Управление правилами маршрутизации трафика"
        action={
          <Button
            onClick={r.openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
          >
            <Plus size={14} /> Новое правило
          </Button>
        }
      />

      <main style={{ padding: 'var(--space-6)' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {r.isLoading && (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>
              Загрузка правил…
            </div>
          )}
          {r.isError && (
            <div style={{ padding: 'var(--space-6)', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              ⚠️ Не удалось загрузить правила маршрутизации
            </div>
          )}
          {!r.isLoading && !r.isError && (
            <RulesTable
              rules={r.rules}
              onEdit={r.openEdit}
              onDelete={r.openDelete}
            />
          )}
        </Card>
      </main>

      {r.createOpen && (
        <RuleFormModal
          isPending={r.isCreating}
          onSubmit={r.create}
          onClose={r.closeCreate}
        />
      )}

      {r.editRule && (
        <RuleFormModal
          initial={r.editRule}
          isPending={r.isUpdating}
          onSubmit={r.update}
          onClose={r.closeEdit}
        />
      )}

      {r.deleteRule && (
        <DeleteConfirmDialog
          rule={r.deleteRule}
          isPending={r.isDeleting}
          onConfirm={r.remove}
          onCancel={r.closeDelete}
        />
      )}
    </>
  )
}
