import { useEffect } from 'react'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui-store'

export function useNotifications() {
  const { notificationsEnabled, setNotificationsEnabled } = useUIStore()

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationsEnabled(false)
      return
    }

    if (notificationsEnabled && Notification.permission === 'denied') {
      setNotificationsEnabled(false)
    }
  }, [notificationsEnabled, setNotificationsEnabled])

  // Auto-request permission after a short delay for better UX
  useEffect(() => {
    const autoRequestPermission = async () => {
      if (!('Notification' in window)) {
        return
      }

      // If already granted, enable immediately
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true)
        return
      }

      // Check if we've already asked in this session
      const hasAskedInSession = sessionStorage.getItem('mailhog-notification-asked')
      if (hasAskedInSession) {
        return
      }

      // Only auto-request if permission is default (not granted or denied)
      // Add delay to avoid being too aggressive
      if (Notification.permission === 'default') {
        setTimeout(async () => {
          try {
            // Mark that we've asked in this session
            sessionStorage.setItem('mailhog-notification-asked', 'true')
            
            const permission = await Notification.requestPermission()
            const granted = permission === 'granted'
            setNotificationsEnabled(granted)
            if (granted) {
              toast.success('Notifications enabled! You\'ll be notified of new emails.')
            }
          } catch (error) {
            console.warn('Failed to request notification permission:', error)
          }
        }, 2000) // 2 second delay
      }
    }

    autoRequestPermission()
  }, [setNotificationsEnabled]) // Only run once on mount

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true)
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    setNotificationsEnabled(granted)
    if (granted) {
      toast.success('Notifications enabled! You\'ll be notified of new emails.')
    }
    return granted
  }

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
    } else {
      await requestPermission()
    }
  }

  return {
    notificationsEnabled,
    requestPermission,
    toggleNotifications,
  }
}
