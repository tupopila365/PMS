import { api, USE_MOCK } from './api'
import { mockUsers } from '../mocks/data'
import type { User } from '../types'

export interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (USE_MOCK) {
      const user = mockUsers.find((u) => u.email === email)
      if (user && password === 'password') {
        return { token: 'mock-token-' + user.id, user }
      }
      throw new Error('Invalid credentials')
    }
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },

  async getCurrentUser(): Promise<User> {
    if (USE_MOCK) {
      const token = localStorage.getItem('token')
      if (!token?.startsWith('mock-token-')) throw new Error('Unauthorized')
      const userId = token.replace('mock-token-', '')
      const user = mockUsers.find((u) => u.id === userId)
      if (!user) throw new Error('User not found')
      return user
    }
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  logout() {
    localStorage.removeItem('token')
  },
}
