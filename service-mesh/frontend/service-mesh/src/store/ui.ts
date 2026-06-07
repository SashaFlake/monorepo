import { create } from 'zustand'

/**
 * Pure UI state managed by Zustand.
 *
 * This slice intentionally contains no server state; it only tracks
 * client-only concerns such as sidebar visibility and the currently
 * selected service identifier.
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
}))
