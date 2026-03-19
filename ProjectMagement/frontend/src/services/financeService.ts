import { api, USE_MOCK } from './api'
import { mockInvoices, mockPayments, mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { Invoice, Payment } from '../types'

export const financeService = {
  async getInvoices(): Promise<Invoice[]> {
    if (USE_MOCK) return mockInvoices
    const { data } = await api.get<Invoice[]>('/invoices')
    return data
  },

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    if (USE_MOCK) {
      const newInvoice: Invoice = { ...invoice, id: 'inv-' + Date.now() }
      mockInvoices.push(newInvoice)
      return newInvoice
    }
    const { data } = await api.post<Invoice>('/invoices', invoice)
    return data
  },

  async getPayments(): Promise<Payment[]> {
    if (USE_MOCK) return mockPayments
    const { data } = await api.get<Payment[]>('/payments')
    return data
  },

  async recordPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    if (USE_MOCK) {
      const newPayment: Payment = { ...payment, id: 'pay-' + Date.now() }
      mockPayments.push(newPayment)
      const inv = mockInvoices.find((i) => i.id === payment.invoiceId)
      if (inv) {
        inv.status = 'paid'
        const project = mockProjects.find((p) => p.id === inv.projectId)
        auditService.log('payment_recorded', 'payment', inv.projectId, project?.name || 'Unknown', newPayment.id)
      }
      return newPayment
    }
    const { data } = await api.post<Payment>('/payments', payment)
    return data
  },
}
