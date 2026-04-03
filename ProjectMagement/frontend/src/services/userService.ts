import { api } from './api'
import type { User, UserRole } from '../types'

export interface CreateUserPayload {
  name: string
  email: string
  role: UserRole
  password: string
  companyId?: string
  /** Match project `type` for discipline-scoped roles (engineer, contractor, vendor). Leave empty for all types. */
  discipline?: string | null
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  password?: string
  companyId?: string
  discipline?: string | null
}

export const userService = {
  /**
   * Lists users for the given company. Non-admin callers are scoped to their JWT company on the server;
   * passing `companyId` must match that company or the API returns 403.
   */
  async getUsers(companyId?: string): Promise<User[]> {
    const params = companyId ? { companyId } : {}
    const { data } = await api.get<User[]>('/users', { params })
    return data
  },

  async getUser(id: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`)
    return data
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<User>('/users', payload)
    return data
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, payload)
    return data
  },
}
