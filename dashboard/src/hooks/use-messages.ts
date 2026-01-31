import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
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
  const { selectedMessageId, setSelectedMessageId, searchQuery, searchKind } = useUIStore()

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: async (_, deletedId) => {
      // Invalidate all message queries (including different search combinations)
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.removeQueries({ queryKey: ['message', deletedId] })
      // Force immediate refetch of current query to ensure UI updates
      await queryClient.refetchQueries({ 
        queryKey: ['messages', searchQuery, searchKind],
        exact: true 
      })
      if (selectedMessageId === deletedId) {
        setSelectedMessageId(null)
      }
    },
  })
}

export function useDeleteAllMessages() {
  const queryClient = useQueryClient()
  const { setSelectedMessageId, searchQuery, searchKind } = useUIStore()

  return useMutation({
    mutationFn: deleteAllMessages,
    onSuccess: async () => {
      // Invalidate all message queries (including different search combinations)
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.removeQueries({ queryKey: ['message'] })
      // Force immediate refetch of current query to ensure UI updates
      await queryClient.refetchQueries({ 
        queryKey: ['messages', searchQuery, searchKind],
        exact: true 
      })
      setSelectedMessageId(null)
    },
  })
}

export function useRefreshMessages() {
  const queryClient = useQueryClient()
  const { searchQuery, searchKind } = useUIStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Invalidate and refetch messages query
      await queryClient.invalidateQueries({ 
        queryKey: ['messages', searchQuery, searchKind] 
      })
      // Force immediate refetch to ensure loading indicators work properly
      await queryClient.refetchQueries({ 
        queryKey: ['messages', searchQuery, searchKind] 
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, searchQuery, searchKind])

  return {
    refresh,
    isRefreshing,
  }
}

export function useAutoRefresh() {
  const queryClient = useQueryClient()
  const { notificationsEnabled, searchQuery, searchKind } = useUIStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastMessageCountRef = useRef<number>(0)

  const showNotification = useCallback(
    (message: Message) => {
      if (!notificationsEnabled) return
      if (!('Notification' in window)) return
      if (Notification.permission !== 'granted') return

      const fromEmail = `${message.From.Mailbox}@${message.From.Domain}`
      const subject =
        message.Content.Headers['Subject']?.[0] ||
        message.Content.Headers['subject']?.[0] ||
        '(No Subject)'

      new Notification('New Email', {
        body: `From: ${fromEmail}\n${subject}`,
        icon: '/mailhog.svg',
        tag: message.ID,
      })
    },
    [notificationsEnabled]
  )

  const checkForNewMessages = useCallback(async () => {
    console.log('[AutoRefresh] Checking for new messages...')
    try {
      const currentData = queryClient.getQueryData(['messages', searchQuery, searchKind]) as 
        { total: number; count: number; start: number; items: Message[] } | undefined

      // Fetch fresh data
      let freshData
      if (searchQuery.trim()) {
        console.log('[AutoRefresh] Fetching search results for:', searchQuery)
        freshData = await searchMessages(searchKind, searchQuery)
      } else {
        console.log('[AutoRefresh] Fetching all messages')
        freshData = await getMessages(0, 50)
      }
      
      console.log('[AutoRefresh] Fetched', freshData.items.length, 'messages (total:', freshData.total, ')')

      if (!currentData) {
        // If no current data, just update cache
        console.log('[AutoRefresh] No current data, initializing cache')
        queryClient.setQueryData(['messages', searchQuery, searchKind], freshData)
        lastMessageCountRef.current = freshData.total
        return
      }

      // Check for new messages
      const currentIds = new Set(currentData.items.map(m => m.ID))
      const newMessages = freshData.items.filter(m => !currentIds.has(m.ID))

      if (newMessages.length > 0) {
        console.log('[AutoRefresh] Found', newMessages.length, 'new messages')
        // Show toast for new messages
        toast.success(`${newMessages.length} new message${newMessages.length === 1 ? '' : 's'} received`)
        // Show notifications for new messages
        newMessages.forEach(message => {
          console.log('[AutoRefresh] Showing notification for message:', message.ID)
          showNotification(message)
        })
      } else {
        console.log('[AutoRefresh] No new messages found')
      }

      // Update cache with fresh data
      queryClient.setQueryData(['messages', searchQuery, searchKind], freshData)
      lastMessageCountRef.current = freshData.total

      // If there are new messages, also invalidate other queries
      if (newMessages.length > 0) {
        console.log('[AutoRefresh] Invalidating other message queries')
        queryClient.invalidateQueries({ queryKey: ['messages'] })
      }

    } catch (error) {
      console.error('[AutoRefresh] Failed:', error)
    }
  }, [queryClient, searchQuery, searchKind, showNotification])

  useEffect(() => {
    // Start auto-refresh interval
    console.log('[AutoRefresh] Starting auto-refresh interval (5 seconds)')
    intervalRef.current = setInterval(checkForNewMessages, 5000) // 5 seconds

    return () => {
      if (intervalRef.current) {
        console.log('[AutoRefresh] Stopping auto-refresh interval')
        clearInterval(intervalRef.current)
      }
    }
  }, [checkForNewMessages])

  return { checkForNewMessages }
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
