import { apiClient } from './client'
import type { Message, MessagesResponse, SearchKind } from './types'

export async function getMessages(
  start: number = 0,
  limit: number = 50
): Promise<MessagesResponse> {
  return apiClient<MessagesResponse>(
    `/api/v2/messages?start=${start}&limit=${limit}`
  )
}

export async function getMessage(id: string): Promise<Message> {
  return apiClient<Message>(`/api/v1/messages/${id}`)
}

export async function deleteMessage(id: string): Promise<void> {
  await apiClient<void>(`/api/v1/messages/${id}`, {
    method: 'DELETE',
  })
}

export async function deleteAllMessages(): Promise<void> {
  await apiClient<void>('/api/v1/messages', {
    method: 'DELETE',
  })
}

export async function searchMessages(
  kind: SearchKind,
  query: string
): Promise<MessagesResponse> {
  const encodedQuery = encodeURIComponent(query)
  return apiClient<MessagesResponse>(
    `/api/v2/search?kind=${kind}&query=${encodedQuery}`
  )
}
