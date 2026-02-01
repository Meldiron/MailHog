import { getBasicAuthHeader } from '@/stores/auth-store'

const API_BASE_URL = 'https://appwrite-mailhog-api.up.railway.app'

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const authHeader = getBasicAuthHeader()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authHeader && { Authorization: authHeader }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export function getWebSocketUrl(): string {
  const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws'
  const baseWithoutProtocol = API_BASE_URL.replace(/^https?:\/\//, '')
  return `${wsProtocol}://${baseWithoutProtocol}/api/v2/websocket`
}

export { API_BASE_URL }
