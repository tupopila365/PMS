import { api, USE_MOCK } from './api'
import { mockTimesheetEntries, mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { TimesheetEntry } from '../types'

export const timesheetService = {
  async getEntries(projectId?: string, userId?: string): Promise<TimesheetEntry[]> {
    if (USE_MOCK) {
      let list = mockTimesheetEntries
      if (projectId) list = list.filter((e) => e.projectId === projectId)
      if (userId) list = list.filter((e) => e.userId === userId)
      return list
    }
    const params: Record<string, string> = {}
    if (projectId) params.projectId = projectId
    if (userId) params.userId = userId
    const { data } = await api.get<TimesheetEntry[]>('/timesheets', { params })
    return data
  },

  async createEntry(entry: Omit<TimesheetEntry, 'id'>): Promise<TimesheetEntry> {
    if (USE_MOCK) {
      const newEntry: TimesheetEntry = { ...entry, id: 'ts-' + Date.now() }
      mockTimesheetEntries.push(newEntry)
      const project = mockProjects.find((p) => p.id === entry.projectId)
      auditService.log('timesheet_entry', 'timesheet', entry.projectId, project?.name || 'Unknown', newEntry.id)
      return newEntry
    }
    const { data } = await api.post<TimesheetEntry>('/timesheets', entry)
    return data
  },

  async updateEntry(id: string, updates: Partial<TimesheetEntry>): Promise<TimesheetEntry> {
    if (USE_MOCK) {
      const e = mockTimesheetEntries.find((x) => x.id === id)
      if (!e) throw new Error('Not found')
      Object.assign(e, updates)
      return e
    }
    const { data } = await api.put<TimesheetEntry>(`/timesheets/${id}`, updates)
    return data
  },

  async deleteEntry(id: string): Promise<void> {
    if (USE_MOCK) {
      const i = mockTimesheetEntries.findIndex((x) => x.id === id)
      if (i >= 0) mockTimesheetEntries.splice(i, 1)
      return
    }
    await api.delete(`/timesheets/${id}`)
  },
}
