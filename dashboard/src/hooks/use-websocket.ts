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
  // Use selectors for stable references
  const setIsConnected = useUIStore(state => state.setIsConnected)
  const notificationsEnabled = useUIStore(state => state.notificationsEnabled)
  const searchQuery = useUIStore(state => state.searchQuery)
  const searchKind = useUIStore(state => state.searchKind)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addMessageToCache = useAddMessageToCache()

  // Use refs to store current values to avoid recreating callbacks
  const searchQueryRef = useRef(searchQuery)
  const searchKindRef = useRef(searchKind)
  const notificationsEnabledRef = useRef(notificationsEnabled)

  // Update refs when values change using useEffect
  useEffect(() => {
    searchQueryRef.current = searchQuery
    searchKindRef.current = searchKind
    notificationsEnabledRef.current = notificationsEnabled
  }, [searchQuery, searchKind, notificationsEnabled])

  const showNotification = useCallback(
    (message: Message) => {
      try {
        if (!notificationsEnabledRef.current) return
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
      } catch (error) {
        console.error('[WebSocket] Notification error:', error)
      }
    },
    [] // No dependencies - we use the ref instead
  )

  const updateMessageCache = useCallback(
    (message: Message) => {
      try {
        // Update cache for current query using refs
        const currentSearchQuery = searchQueryRef.current
        const currentSearchKind = searchKindRef.current
        
        queryClient.setQueryData(
          ['messages', currentSearchQuery, currentSearchKind],
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
      } catch (error) {
        console.error('[WebSocket] Cache update error:', error)
      }
    },
    [queryClient, addMessageToCache] // Removed searchQuery and searchKind dependencies
  )

  // Use a ref to store the connect function to avoid circular dependency
  const connectRef = useRef<(() => void) | undefined>(undefined)
  
  const connect = useCallback(() => {
    try {
      // Check if WebSocket is supported
      if (typeof WebSocket === 'undefined') {
        console.warn('[WebSocket] WebSocket not supported in this browser')
        setIsConnected(false)
        return
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const wsUrl = getWebSocketUrl()
      console.log('[WebSocket] Attempting to connect to:', wsUrl)

      if (!wsUrl || wsUrl.trim() === '' || (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://'))) {
        console.error('[WebSocket] Invalid WebSocket URL:', wsUrl)
        setIsConnected(false)
        return
      }

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        try {
          console.log('[WebSocket] Connection established successfully')
          setIsConnected(true)
          reconnectAttempts.current = 0
        } catch (error) {
          console.error('[WebSocket] Error in onopen handler:', error)
        }
      }

      ws.onclose = (event) => {
        try {
          console.log('[WebSocket] Connection closed, code:', event.code, 'reason:', event.reason)
          setIsConnected(false)
          wsRef.current = null

          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.current++
            console.log('[WebSocket] Scheduling reconnect attempt', reconnectAttempts.current, 'in', RECONNECT_INTERVAL, 'ms')
            reconnectTimeoutRef.current = setTimeout(() => {
              connectRef.current?.()
            }, RECONNECT_INTERVAL)
          } else {
            console.log('[WebSocket] Max reconnect attempts reached, giving up')
          }
        } catch (error) {
          console.error('[WebSocket] Error in onclose handler:', error)
        }
      }

      ws.onerror = (error) => {
        try {
          console.error('[WebSocket] Connection error:', error)
          setIsConnected(false)
        } catch (err) {
          console.error('[WebSocket] Error in onerror handler:', err)
        }
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
      try {
        setIsConnected(false)
        // Don't attempt reconnection if WebSocket creation fails
        reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS
      } catch (err) {
        console.error('[WebSocket] Error setting connection status:', err)
      }
    }
  }, [setIsConnected, updateMessageCache, showNotification])
  
  // Store connect function in ref using useEffect
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    try {
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
    } catch (error) {
      console.error('[WebSocket] Error during disconnect:', error)
    }
  }, [setIsConnected])

  useEffect(() => {
    // Add delay to prevent immediate connection attempts that might crash
    const timeoutId = setTimeout(() => {
      try {
        connectRef.current?.()
      } catch (error) {
        console.error('[WebSocket] Error in useEffect:', error)
        setIsConnected(false)
      }
    }, 1000) // 1 second delay

    return () => {
      clearTimeout(timeoutId)
      try {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
      } catch (error) {
        console.error('[WebSocket] Error in cleanup:', error)
      }
    }
  }, [setIsConnected])

  return { connect, disconnect }
}
