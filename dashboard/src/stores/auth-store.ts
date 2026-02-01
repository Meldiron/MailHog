import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  email: string | null

  login: (email: string, password: string) => void
  logout: () => void
  getCredentials: () => { email: string; password: string } | null
}

const AUTH_KEY = 'mailhog-auth'

function getStoredCredentials(): { email: string; password: string } | null {
  try {
    const stored = sessionStorage.getItem(AUTH_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Invalid stored data
  }
  return null
}

export const useAuthStore = create<AuthState>()((set) => {
  const stored = getStoredCredentials()

  return {
    isAuthenticated: stored !== null,
    email: stored?.email ?? null,

    login: (email: string, password: string) => {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify({ email, password }))
      set({ isAuthenticated: true, email })
    },

    logout: () => {
      sessionStorage.removeItem(AUTH_KEY)
      set({ isAuthenticated: false, email: null })
    },

    getCredentials: () => getStoredCredentials(),
  }
})

export function getBasicAuthHeader(): string | null {
  const credentials = getStoredCredentials()
  if (!credentials) return null

  const encoded = btoa(`${credentials.email}:${credentials.password}`)
  return `Basic ${encoded}`
}

export function getAuthQueryParams(): string {
  const credentials = getStoredCredentials()
  if (!credentials) return ''

  return `u=${encodeURIComponent(credentials.email)}&p=${encodeURIComponent(credentials.password)}`
}
