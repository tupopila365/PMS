import { api, USE_MOCK } from './api'
import { mockImages } from '../mocks/data'
import type { Image } from '../types'

export const mediaService = {
  async getImages(projectId?: string): Promise<Image[]> {
    if (USE_MOCK) return projectId ? mockImages.filter((i) => i.projectId === projectId) : mockImages
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Image[]>('/images', { params })
    return data
  },

  async uploadImage(file: File, projectId: string, uploadedBy?: string): Promise<Image> {
    if (USE_MOCK) {
      const newImage: Image = {
        id: 'mock-' + Date.now(),
        projectId,
        companyId: '1',
        filePath: `/storage/project_${projectId}/images/${file.name}`,
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: new Date().toISOString(),
        fileName: file.name,
        uploadedBy,
      }
      mockImages.push(newImage)
      return newImage
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    const { data } = await api.post<Image>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
