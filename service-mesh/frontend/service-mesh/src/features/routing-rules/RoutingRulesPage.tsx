import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { useRoutingRules } from './model/useRoutingRules'
import { RulesTable } from './components/RulesTable/RulesTable'
import { RuleFormModal } from './components/RuleFormModal/RuleFormModal'
import s from './RoutingRulesPage.module.css'

type Props = { serviceId: string }

export function RoutingRulesPage({ serviceId }: Props): ReactElement {
  const {
    rules, isLoading, isError,
    createOpen, editRule,
    openCreate, closeCreate,
    openEdit, openDelete,
    create, update, remove,
    isCreating, isUpdating, isDeleting,
  } = useRoutingRules(serviceId)

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <Button onClick={openCreate}>New rule</Button>
      </div>

      {isError   && <div role="alert" className={s.error}>Failed to load routing rules.</div>}
      {isLoading && <div role="status" className={s.loading}>Loading…</div>}

      <RulesTable
        rules={rules}
        onEdit={openEdit}
        onDelete={(id): void => {
          const rule = rules.find(r => r.id === id)
          if (rule) openDelete(rule)
        }}
        isPending={isDeleting}
      />

      {createOpen && (
        <RuleFormModal
          title="New rule"
          isSubmitting={isCreating}
          onSubmit={create}
          onClose={closeCreate}
        />
      )}

      {editRule && (
        <RuleFormModal
          title="Edit rule"
          initial={editRule}
          isSubmitting={isUpdating}
          onSubmit={update}
          onClose={closeCreate}
        />
      )}
    </div>
  )
}
