import { create } from 'zustand'
import type { RoutingRule } from '@/features/routing-rules'

/**
 * Pure UI state managed by Zustand.
 *
 * This slice intentionally contains no server state; it only tracks
 * client-only concerns such as sidebar visibility, the currently
 * selected service identifier, and routing-rules modal state.
 */
type UIState = {
  /** Whether the sidebar is currently collapsed. */
  sidebarCollapsed: boolean

  /** Toggles {@link sidebarCollapsed} between `true` and `false`. */
  toggleSidebar: () => void

  /** ID of the service currently selected in the UI, or `null` if none. */
  selectedServiceId: string | null

  /** Sets {@link selectedServiceId}. Pass `null` to clear the selection. */
  setSelectedService: (id: string | null) => void

  /** Whether the create-routing-rule modal is open. */
  routingRulesCreateOpen: boolean

  /** Rule currently being edited in the routing-rules modal, or `null`. */
  routingRulesEditRule: RoutingRule | null

  /** Rule currently pending deletion, or `null`. */
  routingRulesDeleteRule: RoutingRule | null

  /** Opens the create-routing-rule modal. */
  openRoutingRulesCreate: () => void

  /** Closes the create-routing-rule modal. */
  closeRoutingRulesCreate: () => void

  /** Opens the edit modal for the given routing rule. */
  openRoutingRulesEdit: (rule: RoutingRule) => void

  /** Closes the edit modal. */
  closeRoutingRulesEdit: () => void

  /** Opens the delete confirmation dialog for the given routing rule. */
  openRoutingRulesDelete: (rule: RoutingRule) => void

  /** Closes the delete confirmation dialog. */
  closeRoutingRulesDelete: () => void
}

/**
 * Zustand store for global UI state.
 *
 * @sideEffects Creates a Zustand store singleton at module evaluation.
 *              Mutations are confined to the store's internal state;
 *              consumers receive stable references.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: (): void => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedServiceId: null,
  setSelectedService: (id): void => set({ selectedServiceId: id }),

  routingRulesCreateOpen: false,
  routingRulesEditRule: null,
  routingRulesDeleteRule: null,

  openRoutingRulesCreate: (): void => set({ routingRulesCreateOpen: true }),
  closeRoutingRulesCreate: (): void => set({ routingRulesCreateOpen: false }),

  openRoutingRulesEdit: (rule): void => set({ routingRulesEditRule: rule }),
  closeRoutingRulesEdit: (): void => set({ routingRulesEditRule: null }),

  openRoutingRulesDelete: (rule): void => set({ routingRulesDeleteRule: rule }),
  closeRoutingRulesDelete: (): void => set({ routingRulesDeleteRule: null }),
}))
