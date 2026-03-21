import { api } from './api'
import type { Invoice, Payment } from '../types'

export const financeService = {
  async getInvoices(): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>('/invoices')
    return data
  },

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const { data } = await api.post<Invoice>('/invoices', invoice)
    return data
  },

  async getPayments(): Promise<Payment[]> {
    const { data } = await api.get<Payment[]>('/payments')
    return data
  },

  async recordPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const { data } = await api.post<Payment>('/payments', payment)
    return data
  },
}
