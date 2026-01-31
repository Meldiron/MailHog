import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMessages,
  getMessage,
  deleteMessage,
  deleteAllMessages,
  searchMessages,
} from '@/api/messages'
import type { Message } from '@/api/types'
import { useUIStore } from '@/stores/ui-store'

export function useMessages() {
  const { searchQuery, searchKind } = useUIStore()

  return useQuery({
    queryKey: ['messages', searchQuery, searchKind],
    queryFn: async () => {
      if (searchQuery.trim()) {
        return searchMessages(searchKind, searchQuery)
      }
      return getMessages(0, 50)
    },
    refetchInterval: false,
    staleTime: 30000,
  })
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: ['message', id],
    queryFn: () => getMessage(id!),
    enabled: !!id,
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  const { selectedMessageId, setSelectedMessageId } = useUIStore()

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.removeQueries({ queryKey: ['message', deletedId] })
      if (selectedMessageId === deletedId) {
        setSelectedMessageId(null)
      }
    },
  })
}

export function useDeleteAllMessages() {
  const queryClient = useQueryClient()
  const { setSelectedMessageId } = useUIStore()

  return useMutation({
    mutationFn: deleteAllMessages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.removeQueries({ queryKey: ['message'] })
      setSelectedMessageId(null)
    },
  })
}

export function useAddMessageToCache() {
  const queryClient = useQueryClient()

  return (message: Message) => {
    queryClient.setQueryData(
      ['messages', '', 'containing'],
      (old: { total: number; count: number; start: number; items: Message[] } | undefined) => {
        if (!old) return old
        const exists = old.items.some((m) => m.ID === message.ID)
        if (exists) return old
        return {
          ...old,
          total: old.total + 1,
          count: old.count + 1,
          items: [message, ...old.items],
        }
      }
    )
  }
}
