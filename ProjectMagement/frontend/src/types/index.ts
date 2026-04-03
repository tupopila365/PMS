export type UserRole = 'admin' | 'project_manager' | 'engineer' | 'contractor' | 'accountant' | 'vendor'

/** RBAC reference row from GET /api/roles/catalog */
export interface RoleCatalogEntry {
  role: UserRole
  access: string
  description: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  companyId: string
  /** When set (non-admin PM/accountant), server filters projects to this type (case-insensitive). */
  discipline?: string | null
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

/** Any string (built-in presets or custom, e.g. "Mining", "Water works"). */
export type ProjectType = string

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
  /** QC: sample / mock-up required before execution */
  sampleRequired?: boolean
  /** Formal approval required before closing the task */
  approvalRequired?: boolean
  /** Cleared from default views; use Unarchive to restore. Distinct from status (e.g. completed). */
  archived?: boolean
  createdAt?: string
}

/** Scope change / addition outside original contract (VO). */
export interface VariationOrder {
  id: string
  projectId: string
  reference?: string
  title: string
  description?: string
  status?: string
  valueEstimate?: number
  requestedAt?: string
  /** Set by server on create — submitter for approval notifications */
  submittedByUserId?: string
  /** Optional ERP / finance system reference once agreed */
  erpReference?: string
}

/** Request for information — tag responders for direct notifications. */
export interface ProjectRFI {
  id: string
  projectId: string
  subject: string
  question?: string
  criticality?: 'low' | 'medium' | 'high' | 'critical'
  /** draft (no notify) | open | issued | answered | closed */
  status?: string
  responderUserIds?: string[]
  dueDate?: string
  /** Set by server — who raised the RFI */
  raisedByUserId?: string
  /** Formal response text when status is answered */
  responseText?: string
}

/** Single BOQ line (imported or manual). */
export interface BoqLine {
  id: string
  projectId: string
  itemCode: string
  description?: string
  unit?: string
  quantity?: number
  rate?: number
  amount?: number
  section?: string
}

export interface BoqCompareProjectMeta {
  id: string
  name: string
}

export interface BoqCompareCell {
  quantity?: number
  rate?: number
  amount?: number
  unit?: string
  description?: string
}

export interface BoqCompareRow {
  itemCode: string
  description?: string
  byProject: Record<string, BoqCompareCell>
}

export interface BoqCompareResult {
  projects: BoqCompareProjectMeta[]
  rows: BoqCompareRow[]
}

/** Thread on an image (upload note + user comments). */
export interface ImageComment {
  id: string
  text: string
  authorName: string
  userId?: string
  createdAt: string
  /** upload_note = from upload flow; comment = added later on the image */
  kind?: string
}

export interface Image {
  id: string
  projectId: string
  companyId: string
  filePath: string
  latitude?: number
  longitude?: number
  /**
   * Server-set after upload: true if GPS was read from EXIF, false if not (map needs GPS).
   * Omitted on older records — infer from latitude/longitude when needed.
   */
  gpsExtracted?: boolean
  /**
   * Server-set after upload: true if `capturedAt` was read from EXIF, false if no camera date in file.
   */
  capturedFromExif?: boolean
  /** EXIF DateTimeOriginal / digitized — when the photo was taken (camera). */
  capturedAt?: string
  /** When the file was uploaded to the server (always set on new uploads). */
  uploadedAt?: string
  /** Legacy records only: before capturedAt/uploadedAt split. */
  timestamp?: string
  fileName?: string
  uploadedBy?: string
  /** Legacy single upload note (API merges into `comments` for display). */
  comment?: string
  comments?: ImageComment[]
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
  | 'project_created'
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
  /** Set when submitted from the app so approve/reject can notify the requester. */
  requesterUserId?: string
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
  /** Present when the file is stored on the server (multipart upload). */
  filePath?: string
}

export type NotificationType =
  | 'risk'
  | 'change'
  | 'assignment'
  | 'milestone'
  | 'general'
  | 'timesheet_reminder'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  projectId?: string
  taskId?: string
  /** When set, notification is only shown to this user (in-app inbox). */
  targetUserId?: string
  read: boolean
  createdAt: string
  /** Structured fields (e.g. task assignment) for richer UI; optional on older records. */
  taskTitle?: string
  projectName?: string
  assignedByName?: string
  dueDate?: string
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
