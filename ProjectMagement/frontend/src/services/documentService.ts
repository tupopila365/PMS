import { api, USE_MOCK } from './api'
import { mockDocuments } from '../mocks/data'
import type { Document } from '../types'

export const documentService = {
  async getDocuments(projectId?: string, taskId?: string): Promise<Document[]> {
    if (USE_MOCK) {
      let docs = [...mockDocuments]
      if (projectId) docs = docs.filter((d) => d.projectId === projectId)
      if (taskId) docs = docs.filter((d) => d.taskId === taskId)
      return docs
    }
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (taskId) params.set('taskId', taskId)
    const { data } = await api.get<Document[]>(`/documents?${params}`)
    return data
  },

  async uploadDocument(doc: Omit<Document, 'id' | 'uploadedAt' | 'version'>): Promise<Document> {
    if (USE_MOCK) {
      const newDoc: Document = {
        ...doc,
        id: 'doc-' + Date.now(),
        version: 1,
        uploadedAt: new Date().toISOString(),
      }
      mockDocuments.push(newDoc)
      return newDoc
    }
    const { data } = await api.post<Document>('/documents', doc)
    return data
  },

  async deleteDocument(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockDocuments.findIndex((d) => d.id === id)
      if (idx >= 0) mockDocuments.splice(idx, 1)
      return
    }
    await api.delete(`/documents/${id}`)
  },
}
