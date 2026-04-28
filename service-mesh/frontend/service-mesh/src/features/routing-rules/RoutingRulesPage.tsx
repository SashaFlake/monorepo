import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRoutingRules } from './model/useRoutingRules'
import { RulesTable } from './components/RulesTable/RulesTable'
import { RuleFormModal } from './components/RuleFormModal/RuleFormModal'
import { DeleteRuleDialog } from './components/DeleteRuleDialog/DeleteRuleDialog'
import s from './RoutingRulesPage.module.css'

interface Props {
  serviceId: string
}

export function RoutingRulesPage({ serviceId }: Props) {
  const r = useRoutingRules(serviceId)

  return (
    <>
      <Header
        title="Routing Rules"
        subtitle="Manage traffic routing rules"
        action={
          <Button onClick={r.openCreate}>
            <Plus size={14} /> New rule
          </Button>
        }
      />

      <main className={s.main}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {r.isLoading && <div className={s.loading}>Loading rules…</div>}
          {r.isError && <div className={s.error}>⚠️ Failed to load routing rules</div>}
          {!r.isLoading && !r.isError && (
            <RulesTable
              rules={r.rules}
              onEdit={r.openEdit}
              onDelete={(id) => r.openDelete(id)}
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
        <DeleteRuleDialog
          rule={r.deleteRule}
          isPending={r.isDeleting}
          onConfirm={r.remove}
          onCancel={r.closeDelete}
        />
      )}
    </>
  )
}
