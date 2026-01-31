import { useEffect } from 'react'
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
