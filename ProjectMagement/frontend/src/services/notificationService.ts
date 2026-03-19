import { api, USE_MOCK } from './api'
import { mockNotifications } from '../mocks/data'
import type { Notification } from '../types'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    if (USE_MOCK) return [...mockNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const { data } = await api.get<Notification[]>('/notifications')
    return data
  },

  async markRead(id: string): Promise<void> {
    if (USE_MOCK) {
      const n = mockNotifications.find((x) => x.id === id)
      if (n) n.read = true
      return
    }
    await api.patch(`/notifications/${id}`, { read: true })
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) {
      mockNotifications.forEach((n) => { n.read = true })
      return
    }
    await api.post('/notifications/read-all')
  },
}
