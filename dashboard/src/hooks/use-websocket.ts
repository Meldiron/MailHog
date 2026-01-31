import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getWebSocketUrl, AUTH_HEADER } from '@/api/client'
import { useUIStore } from '@/stores/ui-store'
import type { Message } from '@/api/types'

const RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const queryClient = useQueryClient()
  const { setIsConnected, notificationsEnabled } = useUIStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const addMessageToCache = useCallback(
    (message: Message) => {
      queryClient.setQueryData(
        ['messages', '', 'containing'],
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

      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    [queryClient]
  )

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const wsUrl = getWebSocketUrl()
    const credentials = atob(AUTH_HEADER.replace('Basic ', ''))
    const [username, password] = credentials.split(':')

    const urlWithAuth = new URL(wsUrl)
    urlWithAuth.username = username
    urlWithAuth.password = password

    try {
      const ws = new WebSocket(urlWithAuth.toString())

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_INTERVAL)
        }
      }

      ws.onerror = () => {
        setIsConnected(false)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.Type === 'new' && data.Content) {
            const message = data.Content as Message
            addMessageToCache(message)
            showNotification(message)
          }
        } catch {
          // Ignore parse errors
        }
      }

      wsRef.current = ws
    } catch {
      setIsConnected(false)
    }
  }, [setIsConnected, addMessageToCache, showNotification])

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
