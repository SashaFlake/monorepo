import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRoutingRules } from './model/useRoutingRules'
import { RulesTable } from './components/RulesTable'
import { RuleFormModal } from './components/RuleFormModal'
import { DeleteRuleDialog } from './components/DeleteRuleDialog'
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
        subtitle="Управление правилами маршрутизации трафика"
        action={
          <Button onClick={r.openCreate}>
            <Plus size={14} /> Новое правило
          </Button>
        }
      />

      <main className={s.main}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {r.isLoading && <div className={s.loading}>Загрузка правил…</div>}
          {r.isError && <div className={s.error}>⚠️ Не удалось загрузить правила маршрутизации</div>}
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
