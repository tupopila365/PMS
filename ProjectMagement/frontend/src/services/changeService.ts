import { api } from './api'
import type { ChangeRequest, ChangeRequestStatus, ApprovalStep } from '../types'

function pickStr(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

const STATUSES: ChangeRequestStatus[] = ['pending', 'under_review', 'approved', 'rejected']
const STEPS: ApprovalStep[] = ['submitted', 'under_review', 'approved', 'rejected']

function normalizeChange(raw: unknown): ChangeRequest {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const statusRaw = pickStr(r, 'status').toLowerCase()
  const status = (STATUSES.includes(statusRaw as ChangeRequestStatus) ? statusRaw : 'pending') as ChangeRequestStatus
  const stepRaw = pickStr(r, 'approvalStep', 'approval_step').toLowerCase()
  const approvalStep = STEPS.includes(stepRaw as ApprovalStep) ? (stepRaw as ApprovalStep) : undefined

  return {
    id: pickStr(r, 'id'),
    projectId: pickStr(r, 'projectId', 'project_id'),
    title: pickStr(r, 'title'),
    reason: pickStr(r, 'reason'),
    requester: pickStr(r, 'requester'),
    requestedAt: pickStr(r, 'requestedAt', 'requested_at'),
    impactScope: pickStr(r, 'impactScope', 'impact_scope') || undefined,
    impactSchedule: pickStr(r, 'impactSchedule', 'impact_schedule') || undefined,
    impactBudget: pickStr(r, 'impactBudget', 'impact_budget') || undefined,
    status,
    approvalStep,
    reviewedBy: pickStr(r, 'reviewedBy', 'reviewed_by') || undefined,
    reviewedAt: pickStr(r, 'reviewedAt', 'reviewed_at') || undefined,
    approvedBy: pickStr(r, 'approvedBy', 'approved_by') || undefined,
    approvedAt: pickStr(r, 'approvedAt', 'approved_at') || undefined,
    requesterUserId: pickStr(r, 'requesterUserId', 'requester_user_id') || undefined,
  }
}

export type CreateChangePayload = {
  projectId: string
  title: string
  reason: string
  requester: string
  requesterUserId?: string
  requestedAt: string
  impactScope?: string
  impactSchedule?: string
  impactBudget?: string
  status?: ChangeRequestStatus
  approvalStep?: ApprovalStep
}

export const changeService = {
  async getChanges(projectId?: string): Promise<ChangeRequest[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<unknown[]>('/changes', { params })
    if (!Array.isArray(data)) return []
    return data.map(normalizeChange)
  },

  async createChange(change: CreateChangePayload): Promise<ChangeRequest> {
    const body = {
      ...change,
      status: change.status ?? 'pending',
      approvalStep: change.approvalStep ?? 'submitted',
    }
    const { data } = await api.post<unknown>('/changes', body)
    return normalizeChange(data)
  },

  async updateChange(id: string, updates: Partial<ChangeRequest>): Promise<ChangeRequest> {
    const { data } = await api.put<unknown>(`/changes/${id}`, updates)
    return normalizeChange(data)
  },
}
