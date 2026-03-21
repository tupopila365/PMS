import { api } from './api'
import type { Image } from '../types'

export const mediaService = {
  async getImages(projectId?: string): Promise<Image[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Image[]>('/images', { params })
    return data
  },

  async uploadImage(file: File, projectId: string, uploadedBy?: string): Promise<Image> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    if (uploadedBy) formData.append('uploadedBy', uploadedBy)
    const { data } = await api.post<Image>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
