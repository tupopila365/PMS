export type UserRole = 'admin' | 'project_manager' | 'engineer' | 'contractor' | 'accountant' | 'vendor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  companyId: string
}

export interface Company {
  id: string
  name: string
  subscriptionId: string
}

export type PlanTier = 'starter' | 'standard' | 'professional' | 'enterprise'

export interface Subscription {
  id: string
  companyId: string
  plan: PlanTier
  maxUsers: number
  maxProjects: number
  storageGB: number
  expiresAt: string
  status: 'active' | 'cancelled' | 'past_due'
}

export type ProjectType = 'construction' | 'roads' | 'railway' | 'buildings'

export type RiskLevel = 'low' | 'medium' | 'high'

export type PipelineStatus = 'idea' | 'proposal' | 'planning' | 'approved' | 'active' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  type: ProjectType
  companyId: string
  status?: PipelineStatus | string
  region?: string
  client?: string
  riskLevel?: RiskLevel
  budget?: number
  actualCost?: number
  plannedEndDate?: string
  actualEndDate?: string
  createdAt?: string
}

export type TaskStatus = 'not_started' | 'in_progress' | 'completed'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  assignedTo?: string[]
  dueDate?: string
  startDate?: string
  endDate?: string
  duration?: number
  predecessors?: string[]
  parentId?: string
  order?: number
  isMilestone?: boolean
  createdAt?: string
}

export interface Image {
  id: string
  projectId: string
  companyId: string
  filePath: string
  latitude?: number
  longitude?: number
  timestamp?: string
  fileName?: string
  uploadedBy?: string
}

export type InvoiceStatus = 'pending' | 'paid'

export interface Invoice {
  id: string
  projectId: string
  amount: number
  status: InvoiceStatus
  createdAt?: string
}

export interface Payment {
  id: string
  invoiceId: string
  amountPaid: number
  paidAt?: string
}

export interface DashboardKPIs {
  totalProjects: number
  activeProjects: number
  onTrackCount: number
  atRiskCount: number
  completionRate: number
  totalBudget: number
  totalPaid: number
  outstandingBalance: number
  aggregateVariance: number
}

export type AuditAction =
  | 'budget_updated'
  | 'task_created'
  | 'task_updated'
  | 'workflow_changed'
  | 'document_uploaded'
  | 'cost_entry'
  | 'risk_created'
  | 'risk_updated'
  | 'change_requested'
  | 'change_approved'
  | 'change_rejected'
  | 'timesheet_entry'
  | 'invoice_created'
  | 'payment_recorded'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entityType: string
  entityId?: string
  projectId: string
  projectName: string
  timestamp: string
}

export interface RolePermission {
  role: UserRole
  access: string
  description: string
}

export interface RiskAlert {
  id: string
  projectId: string
  projectName: string
  message: string
  type: 'schedule' | 'cost' | 'milestone'
  severity: 'medium' | 'high'
}

export type RiskProbability = 1 | 2 | 3 | 4 | 5
export type RiskImpact = 1 | 2 | 3 | 4 | 5

export interface Risk {
  id: string
  projectId: string
  description: string
  probability: RiskProbability
  impact: RiskImpact
  severity: 'low' | 'medium' | 'high' | 'critical'
  owner?: string
  mitigation?: string
  status: 'open' | 'mitigating' | 'closed'
  createdAt?: string
}

export type ChangeRequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected'

export type ApprovalStep = 'submitted' | 'under_review' | 'approved' | 'rejected'

export interface ChangeRequest {
  id: string
  projectId: string
  title: string
  reason: string
  requester: string
  requestedAt: string
  impactScope?: string
  impactSchedule?: string
  impactBudget?: string
  status: ChangeRequestStatus
  approvalStep?: ApprovalStep
  reviewedBy?: string
  reviewedAt?: string
  approvedBy?: string
  approvedAt?: string
}

export interface TimesheetEntry {
  id: string
  projectId: string
  taskId?: string
  userId: string
  hours: number
  date: string
  description?: string
}

export interface CostCategory {
  id: string
  projectId: string
  name: string
  parentId?: string
  budget: number
  actualCost: number
}

export type ResourceType = 'personnel' | 'equipment' | 'material' | 'facility'

export interface Resource {
  id: string
  projectId: string
  type: ResourceType
  name: string
  quantity: number
  unit: string
}

export type RAIDType = 'risk' | 'assumption' | 'issue' | 'dependency'

export interface RAIDItem {
  id: string
  projectId: string
  type: RAIDType
  title: string
  description?: string
  owner?: string
  status: string
  createdAt?: string
}

export interface RACIEntry {
  id: string
  projectId: string
  deliverable: string
  responsible?: string
  accountable?: string
  consulted?: string[]
  informed?: string[]
}

export interface Stakeholder {
  id: string
  projectId: string
  name: string
  role: string
  power: 1 | 2 | 3 | 4 | 5
  interest: 1 | 2 | 3 | 4 | 5
  strategy?: string
}

export interface CostBenefitItem {
  description: string
  amount: number
}

export interface CostBenefitAnalysis {
  id: string
  projectId: string
  costs: CostBenefitItem[]
  benefits: CostBenefitItem[]
  roi?: number
  paybackPeriod?: number
  recommendation?: string
}

export interface Document {
  id: string
  projectId: string
  taskId?: string
  name: string
  type: string
  version: number
  uploadedAt: string
  uploadedBy?: string
}

export interface Notification {
  id: string
  type: 'risk' | 'change' | 'assignment' | 'milestone' | 'general'
  title: string
  message: string
  projectId?: string
  read: boolean
  createdAt: string
}

export interface ProjectBaseline {
  id: string
  projectId: string
  baselineDate: string
  budget: number
  plannedEndDate: string
  scheduleSnapshot?: { taskId: string; startDate: string; endDate: string }[]
}

/** Template task for WBS - uses tempId for predecessor references */
export interface TaskTemplate {
  tempId: string
  title: string
  duration?: number
  isMilestone?: boolean
  order: number
  predecessorTempIds?: string[]
}

/** Template cost category for CBS */
export interface CostCategoryTemplate {
  tempId: string
  name: string
  budget: number
  parentTempId?: string
}

export interface ProjectTemplate {
  id: string
  name: string
  projectType: ProjectType
  description?: string
  wbsTasks: TaskTemplate[]
  cbsCategories: CostCategoryTemplate[]
}
