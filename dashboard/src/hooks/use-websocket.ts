import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getWebSocketUrl } from '@/api/client'
import { useUIStore } from '@/stores/ui-store'
import type { Message } from '@/api/types'
import { useAddMessageToCache } from './use-messages'

const RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const queryClient = useQueryClient()
  const { setIsConnected, notificationsEnabled, searchQuery, searchKind } = useUIStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addMessageToCache = useAddMessageToCache()

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

  const updateMessageCache = useCallback(
    (message: Message) => {
      // Update cache for current query
      queryClient.setQueryData(
        ['messages', searchQuery, searchKind],
        (
          old:
            | { total: number; count: number; start: number; items: Message[] }
            | undefined
        ) => {
          if (!old) {
            return {
              total: 1,
              count: 1,
              start: 0,
              items: [message],
            }
          }
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

      // Also update the default query (no search)
      addMessageToCache(message)
      
      // Invalidate all message queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    [queryClient, searchQuery, searchKind, addMessageToCache]
  )

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const wsUrl = getWebSocketUrl()
    console.log('[WebSocket] Attempting to connect to:', wsUrl)

    const urlWithAuth = new URL(wsUrl)

    try {
      const ws = new WebSocket(urlWithAuth.toString())

      ws.onopen = () => {
        console.log('[WebSocket] Connection established successfully')
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed, reconnect attempts:', reconnectAttempts.current)
        setIsConnected(false)
        wsRef.current = null

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          console.log('[WebSocket] Scheduling reconnect attempt', reconnectAttempts.current, 'in', RECONNECT_INTERVAL, 'ms')
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_INTERVAL)
        } else {
          console.log('[WebSocket] Max reconnect attempts reached, giving up')
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error)
        setIsConnected(false)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WebSocket] Received message:', data)
          if (data.Type === 'new' && data.Content) {
            const message = data.Content as Message
            console.log('[WebSocket] Processing new message:', message.ID)
            updateMessageCache(message)
            showNotification(message)
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error, 'Raw data:', event.data)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket connection:', error)
      setIsConnected(false)
    }
  }, [setIsConnected, updateMessageCache, showNotification])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS
  }, [setIsConnected])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return { connect, disconnect }
}
