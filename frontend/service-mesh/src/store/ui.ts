import { create } from 'zustand'

type UIState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  selectedServiceId: string | null
  setSelectedService: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedServiceId: null,
  setSelectedService: (id) => set({ selectedServiceId: id }),
}))
