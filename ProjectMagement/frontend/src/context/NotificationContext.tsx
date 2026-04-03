import React, { createContext, useContext, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  refetch: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    /** So assignees see new task-assignment notifications without a full page reload. */
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }, [queryClient])

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead()
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }, [queryClient])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    refetch,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
