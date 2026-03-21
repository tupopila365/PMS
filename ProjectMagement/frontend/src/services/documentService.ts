import { api } from './api'
import type { Document } from '../types'

export const documentService = {
  async getDocuments(projectId?: string, taskId?: string): Promise<Document[]> {
    const params: Record<string, string> = {}
    if (projectId) params.projectId = projectId
    if (taskId) params.taskId = taskId
    const { data } = await api.get<Document[]>('/documents', { params })
    return data
  },

  /** Multipart upload; stores file under uploads/documents and registers metadata. */
  async uploadDocument(
    file: File,
    opts: { projectId: string; taskId?: string; uploadedBy?: string }
  ): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', opts.projectId)
    if (opts.taskId) formData.append('taskId', opts.taskId)
    if (opts.uploadedBy) formData.append('uploadedBy', opts.uploadedBy)
    const { data } = await api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Fetch file bytes (JWT sent by axios). Use blob URLs for preview/download in the browser. */
  async fetchFileBlob(id: string, download = false): Promise<Blob> {
    const { data } = await api.get<Blob>(`/documents/file/${id}`, {
      responseType: 'blob',
      params: download ? { download: true } : {},
    })
    return data
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },
}
