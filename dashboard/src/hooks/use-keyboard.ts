import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '@/stores/ui-store'
import { useMessages, useDeleteMessage } from '@/hooks/use-messages'

export function useKeyboard() {
  const queryClient = useQueryClient()
  const { data } = useMessages()
  const deleteMutation = useDeleteMessage()
  const {
    selectedMessageId,
    setSelectedMessageId,
    setCommandPaletteOpen,
    commandPaletteOpen,
  } = useUIStore()

  const messages = data?.items ?? []

  const selectNextMessage = useCallback(() => {
    if (messages.length === 0) return

    if (!selectedMessageId) {
      setSelectedMessageId(messages[0].ID)
      return
    }

    const currentIndex = messages.findIndex((m) => m.ID === selectedMessageId)
    if (currentIndex < messages.length - 1) {
      setSelectedMessageId(messages[currentIndex + 1].ID)
    }
  }, [messages, selectedMessageId, setSelectedMessageId])

  const selectPreviousMessage = useCallback(() => {
    if (messages.length === 0) return

    if (!selectedMessageId) {
      setSelectedMessageId(messages[messages.length - 1].ID)
      return
    }

    const currentIndex = messages.findIndex((m) => m.ID === selectedMessageId)
    if (currentIndex > 0) {
      setSelectedMessageId(messages[currentIndex - 1].ID)
    }
  }, [messages, selectedMessageId, setSelectedMessageId])

  const refreshMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }, [queryClient])

  const deleteSelectedMessage = useCallback(() => {
    if (selectedMessageId) {
      deleteMutation.mutate(selectedMessageId)
    }
  }, [selectedMessageId, deleteMutation])

  const focusSearch = useCallback(() => {
    const searchInput = document.getElementById('search-input')
    if (searchInput) {
      searchInput.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandPaletteOpen) return

      const target = e.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
        return
      }

      if (isInputFocused) return

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault()
          selectNextMessage()
          break
        case 'k':
        case 'ArrowUp':
          e.preventDefault()
          selectPreviousMessage()
          break
        case 'r':
          e.preventDefault()
          refreshMessages()
          break
        case 'd':
          e.preventDefault()
          deleteSelectedMessage()
          break
        case '/':
          e.preventDefault()
          focusSearch()
          break
        case 'Escape':
          e.preventDefault()
          setSelectedMessageId(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    commandPaletteOpen,
    selectNextMessage,
    selectPreviousMessage,
    refreshMessages,
    deleteSelectedMessage,
    focusSearch,
    setSelectedMessageId,
    setCommandPaletteOpen,
  ])

  return {
    selectNextMessage,
    selectPreviousMessage,
    refreshMessages,
    deleteSelectedMessage,
    focusSearch,
  }
}
