import { api } from './api'
import type { User, UserRole } from '../types'

export interface CreateUserPayload {
  name: string
  email: string
  role: UserRole
  password: string
  companyId?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  password?: string
  companyId?: string
}

export const userService = {
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
