import { api } from './api'
import type { VariationOrder, ProjectRFI, BoqLine, BoqCompareResult } from '../types'

export const variationOrderService = {
  async list(projectId: string): Promise<VariationOrder[]> {
    const { data } = await api.get<VariationOrder[]>(`/projects/${projectId}/variation-orders`)
    return data
  },
  async create(projectId: string, body: Partial<VariationOrder>): Promise<VariationOrder> {
    const { data } = await api.post<VariationOrder>(`/projects/${projectId}/variation-orders`, body)
    return data
  },
  async update(projectId: string, id: string, body: Partial<VariationOrder>): Promise<VariationOrder> {
    const { data } = await api.put<VariationOrder>(`/projects/${projectId}/variation-orders/${id}`, body)
    return data
  },
}

export const projectRfiService = {
  async list(projectId: string): Promise<ProjectRFI[]> {
    const { data } = await api.get<ProjectRFI[]>(`/projects/${projectId}/rfis`)
    return data
  },
  async create(projectId: string, body: Partial<ProjectRFI>): Promise<ProjectRFI> {
    const { data } = await api.post<ProjectRFI>(`/projects/${projectId}/rfis`, body)
    return data
  },
  async update(projectId: string, id: string, body: Partial<ProjectRFI>): Promise<ProjectRFI> {
    const { data } = await api.put<ProjectRFI>(`/projects/${projectId}/rfis/${id}`, body)
    return data
  },
}

export const boqService = {
  async list(projectId: string): Promise<BoqLine[]> {
    const { data } = await api.get<BoqLine[]>(`/projects/${projectId}/boq`)
    return data
  },
  async importCsv(projectId: string, file: File): Promise<{ imported: number; projectId: string }> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<{ imported: number; projectId: string }>(`/projects/${projectId}/boq/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  async compare(projectIds: string[]): Promise<BoqCompareResult> {
    const { data } = await api.get<BoqCompareResult>('/boq/compare', {
      params: { projectIds: projectIds.join(',') },
    })
    return data
  },
}
