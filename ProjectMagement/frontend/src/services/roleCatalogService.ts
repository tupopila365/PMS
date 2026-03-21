import { api } from './api'
import type { RoleCatalogEntry } from '../types'

export const roleCatalogService = {
  async getRoleCatalog(): Promise<RoleCatalogEntry[]> {
    const { data } = await api.get<RoleCatalogEntry[]>('/roles/catalog')
    return data
  },
}
