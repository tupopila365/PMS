import { api } from './api'
import type { Notification, NotificationType } from '../types'

export interface CreateNotificationPayload {
  type: NotificationType
  title: string
  message: string
  targetUserId: string
  projectId?: string
  taskId?: string
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>('/notifications')
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async createNotification(payload: CreateNotificationPayload): Promise<Notification> {
    const { data } = await api.post<Notification>('/notifications', payload)
    return data
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}`, { read: true })
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all')
  },
}
