import type { ReactElement } from 'react'
import { Button, ErrorCard, Skeleton } from '@/shared/ui'
import { useRoutingRules } from '@/features/routing-rules'
import { RulesTable } from './RulesTable/RulesTable'
import { RuleFormModal } from './RuleFormModal/RuleFormModal'
import { DeleteRuleDialog } from './DeleteRuleDialog/DeleteRuleDialog'
import s from './RoutingRulesPage.module.css'

/**
 * Props for {@link RoutingRulesPage}.
 */
type Props = {
  /** Identifier of the service whose routing rules are displayed. */
  serviceId: string
}

/**
 * Page component for managing routing rules of a single service.
 *
 * Renders a toolbar, a table of rules, and conditional create/edit/delete
 * modals driven by {@link useRoutingRules}.
 *
 * @param serviceId - Service identifier
 * @returns The routing rules page element
 * @sideEffects Calls {@link useRoutingRules} (TanStack Query subscription
 *              and local modal state mutations).
 */
export function RoutingRulesPage({ serviceId }: Props): ReactElement {
  const {
    rules, isLoading, isError,
    createOpen, editRule, deleteRule,
    openCreate, closeCreate,
    openEdit, closeEdit,
    openDelete, closeDelete,
    create, update, remove,
    isCreating, isUpdating, isDeleting,
  } = useRoutingRules(serviceId)

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <Button onClick={openCreate}>New rule</Button>
      </div>

      {isError   && <ErrorCard message="Failed to load routing rules." />}
      {isLoading && <Skeleton width="100%" height="200px" />}

      <RulesTable
        rules={rules}
        onEdit={openEdit}
        onDelete={openDelete}
        isPending={isDeleting}
      />

      {createOpen && (
        <RuleFormModal
          isPending={isCreating}
          onSubmit={create}
          onClose={closeCreate}
        />
      )}

      {editRule && (
        <RuleFormModal
          initial={editRule}
          isPending={isUpdating}
          onSubmit={update}
          onClose={closeEdit}
        />
      )}

      {deleteRule && (
        <DeleteRuleDialog
          rule={deleteRule}
          isPending={isDeleting}
          onConfirm={remove}
          onCancel={closeDelete}
        />
      )}
    </div>
  )
}
