import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SearchKind } from '@/api/types'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  setTheme: (theme: Theme) => void

  selectedMessageId: string | null
  setSelectedMessageId: (id: string | null) => void

  searchQuery: string
  searchKind: SearchKind
  setSearchQuery: (query: string) => void
  setSearchKind: (kind: SearchKind) => void

  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void

  isConnected: boolean
  setIsConnected: (connected: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      selectedMessageId: null,
      setSelectedMessageId: (id) => set({ selectedMessageId: id }),

      searchQuery: '',
      searchKind: 'containing',
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchKind: (kind) => set({ searchKind: kind }),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      notificationsEnabled: false,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),
    }),
    {
      name: 'mailhog-ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        searchKind: state.searchKind,
      }),
    }
  )
)
