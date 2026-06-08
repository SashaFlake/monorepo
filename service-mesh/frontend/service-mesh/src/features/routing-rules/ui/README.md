# `features/routing-rules/ui/`

React components that render the **routing rules** management interface.

This directory contains the complete UI surface of the `routing-rules-ui` bounded
context: the page shell, the data table, the create/edit modal with its form
fields, the destination editor, the weight visualisation, and the delete
confirmation dialog.

## Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `RoutingRulesPage` | `RoutingRulesPage.tsx` | Page shell: toolbar, `RulesTable`, and modal/dialog orchestration. Fetches state via `useRoutingRules`. |
| `RulesTable` | `RulesTable/RulesTable.tsx` | Table of routing rules with columns **Name**, **Priority**, **Match**, **Destinations**, and **Actions**. Built on top of the shared `DataTable` primitive. |
| `RuleFormModal` | `RuleFormModal/RuleFormModal.tsx` | Modal dialog for creating or editing a routing rule. Composes `RuleNameField`, `RuleMatchFields`, and `DestinationList`. |
| `RuleNameField` | `RuleFormModal/RuleNameField.tsx` | Single-line text input for the rule name. |
| `RuleMatchFields` | `RuleFormModal/RuleMatchFields.tsx` | Side-by-side inputs for rule **Priority** and **Path prefix**. |
| `DestinationList` | `DestinationList/DestinationList.tsx` | Editable list of weighted destinations with an "Add destination" button, live weight-sum validation, and an embedded `WeightBar`. |
| `WeightBar` | `WeightBar/WeightBar.tsx` | Visual bar that shows how traffic weight is split between destinations, plus a colour legend. |
| `DeleteRuleDialog` | `DeleteRuleDialog/DeleteRuleDialog.tsx` | Alert dialog that asks for confirmation before deleting a routing rule. |

## Component hierarchy

```
services.$serviceId.routing-rules (route)
  └─ ServiceDetailPage (Routing Rules tab)
       └─ RoutingRulesPage
            ├─ RulesTable
            │    ├─ DataTable (shared primitive)
            │    └─ DeleteRuleDialog (inline confirmation)
            ├─ RuleFormModal
            │    ├─ RuleNameField
            │    ├─ RuleMatchFields
            │    └─ DestinationList
            │         └─ WeightBar
            └─ DeleteRuleDialog (page-level deletion)
```

## Design notes

- All styles are scoped with CSS Modules (`*.module.css`).
- Form state is managed by `@tanstack/react-form` via the `useRuleForm` hook.
- Server state is loaded with TanStack Query through `useRoutingRules`.
- The shared `DataTable` primitive is imported from `@/shared/table`.
