import type { User, Project, Task, Invoice, Payment, Image, DashboardKPIs, AuditLog, RiskAlert, Risk, ChangeRequest, TimesheetEntry, CostCategory, Resource, CostBenefitAnalysis, RAIDItem, RACIEntry, Stakeholder, Subscription, Company, Document, Notification, ProjectBaseline, ProjectTemplate } from '../types'

export const mockSubscriptions: Subscription[] = [
  { id: 'sub-1', companyId: '1', plan: 'standard', maxUsers: 10, maxProjects: -1, storageGB: 50, expiresAt: '2025-12-31', status: 'active' },
]

export const mockCompanies: Company[] = [{ id: '1', name: 'CBMP Construction', subscriptionId: 'sub-1' }]

export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@cbmp.com', role: 'admin', companyId: '1' },
  { id: '2', name: 'Project Manager', email: 'pm@cbmp.com', role: 'project_manager', companyId: '1' },
  { id: '3', name: 'Site Contractor', email: 'contractor@cbmp.com', role: 'contractor', companyId: '1' },
]

export const mockProjectTemplates: ProjectTemplate[] = [
  {
    id: 'tpl-roads',
    name: 'Roads & Highways',
    projectType: 'roads',
    description: 'Standard WBS and CBS for road construction projects',
    wbsTasks: [
      { tempId: 't1', title: 'Site Survey', duration: 14, isMilestone: true, order: 0 },
      { tempId: 't2', title: 'Design & Permits', duration: 21, isMilestone: true, order: 1, predecessorTempIds: ['t1'] },
      { tempId: 't3', title: 'Earthworks & Grading', duration: 30, order: 2, predecessorTempIds: ['t2'] },
      { tempId: 't4', title: 'Base Layer', duration: 14, order: 3, predecessorTempIds: ['t3'] },
      { tempId: 't5', title: 'Paving', duration: 21, isMilestone: true, order: 4, predecessorTempIds: ['t4'] },
      { tempId: 't6', title: 'Markings & Signage', duration: 7, order: 5, predecessorTempIds: ['t5'] },
      { tempId: 't7', title: 'Handover', duration: 3, isMilestone: true, order: 6, predecessorTempIds: ['t6'] },
    ],
    cbsCategories: [
      { tempId: 'c1', name: 'Labor', budget: 0 },
      { tempId: 'c2', name: 'Materials', budget: 0 },
      { tempId: 'c3', name: 'Equipment', budget: 0 },
      { tempId: 'c4', name: 'Subcontractors', budget: 0 },
      { tempId: 'c5', name: 'Permits & Fees', budget: 0 },
    ],
  },
  {
    id: 'tpl-railway',
    name: 'Railway Projects',
    projectType: 'railway',
    description: 'WBS and CBS for railway station and track projects',
    wbsTasks: [
      { tempId: 't1', title: 'Feasibility Study', duration: 14, isMilestone: true, order: 0 },
      { tempId: 't2', title: 'Design & Engineering', duration: 60, isMilestone: true, order: 1, predecessorTempIds: ['t1'] },
      { tempId: 't3', title: 'Track Works', duration: 45, order: 2, predecessorTempIds: ['t2'] },
      { tempId: 't4', title: 'Station Construction', duration: 90, isMilestone: true, order: 3, predecessorTempIds: ['t2'] },
      { tempId: 't5', title: 'Signaling & Electrification', duration: 30, order: 4, predecessorTempIds: ['t3', 't4'] },
      { tempId: 't6', title: 'Testing & Commissioning', duration: 14, isMilestone: true, order: 5, predecessorTempIds: ['t5'] },
    ],
    cbsCategories: [
      { tempId: 'c1', name: 'Labor', budget: 0 },
      { tempId: 'c2', name: 'Materials', budget: 0 },
      { tempId: 'c3', name: 'Equipment', budget: 0 },
      { tempId: 'c4', name: 'Subcontractors', budget: 0 },
      { tempId: 'c5', name: 'Engineering', budget: 0 },
    ],
  },
  {
    id: 'tpl-buildings',
    name: 'Buildings & Structures',
    projectType: 'buildings',
    description: 'Standard WBS and CBS for building construction',
    wbsTasks: [
      { tempId: 't1', title: 'Site Preparation', duration: 14, order: 0 },
      { tempId: 't2', title: 'Structural Design', duration: 30, isMilestone: true, order: 1, predecessorTempIds: ['t1'] },
      { tempId: 't3', title: 'Foundation', duration: 21, isMilestone: true, order: 2, predecessorTempIds: ['t2'] },
      { tempId: 't4', title: 'Superstructure', duration: 60, order: 3, predecessorTempIds: ['t3'] },
      { tempId: 't5', title: 'MEP Installation', duration: 45, order: 4, predecessorTempIds: ['t4'] },
      { tempId: 't6', title: 'Finishes & Fit-out', duration: 30, order: 5, predecessorTempIds: ['t5'] },
      { tempId: 't7', title: 'Handover', duration: 7, isMilestone: true, order: 6, predecessorTempIds: ['t6'] },
    ],
    cbsCategories: [
      { tempId: 'c1', name: 'Labor', budget: 0 },
      { tempId: 'c2', name: 'Materials', budget: 0 },
      { tempId: 'c3', name: 'Equipment', budget: 0 },
      { tempId: 'c4', name: 'Subcontractors', budget: 0 },
      { tempId: 'c5', name: 'Design & Engineering', budget: 0 },
    ],
  },
  {
    id: 'tpl-construction',
    name: 'General Construction',
    projectType: 'construction',
    description: 'Generic WBS and CBS for construction projects',
    wbsTasks: [
      { tempId: 't1', title: 'Site Survey', duration: 7, isMilestone: true, order: 0 },
      { tempId: 't2', title: 'Planning & Design', duration: 21, order: 1, predecessorTempIds: ['t1'] },
      { tempId: 't3', title: 'Construction Phase', duration: 60, isMilestone: true, order: 2, predecessorTempIds: ['t2'] },
      { tempId: 't4', title: 'Quality & Snagging', duration: 14, order: 3, predecessorTempIds: ['t3'] },
      { tempId: 't5', title: 'Project Closeout', duration: 7, isMilestone: true, order: 4, predecessorTempIds: ['t4'] },
    ],
    cbsCategories: [
      { tempId: 'c1', name: 'Labor', budget: 0 },
      { tempId: 'c2', name: 'Materials', budget: 0 },
      { tempId: 'c3', name: 'Equipment', budget: 0 },
      { tempId: 'c4', name: 'Subcontractors', budget: 0 },
    ],
  },
]

export const mockProjects: Project[] = [
  { id: '1', name: 'Highway A1 Extension', type: 'roads', companyId: '1', status: 'active', region: 'North', client: 'City Council', riskLevel: 'medium', budget: 500000, actualCost: 520000, plannedEndDate: '2025-06-01' },
  { id: '2', name: 'Office Tower Phase 1', type: 'buildings', companyId: '1', status: 'active', region: 'Central', client: 'Acme Corp', riskLevel: 'low', budget: 2000000, actualCost: 450000, plannedEndDate: '2025-12-31' },
  { id: '3', name: 'Railway Station Upgrade', type: 'railway', companyId: '1', status: 'planning', region: 'West', client: 'Transport Authority', riskLevel: 'high', budget: 800000, actualCost: 0, plannedEndDate: '2025-09-30' },
]

export const mockTasks: Task[] = [
  { id: '1', projectId: '1', title: 'Site Survey', status: 'completed', assignedTo: ['2'], dueDate: '2025-03-01', startDate: '2025-02-15', endDate: '2025-03-01', duration: 14, order: 0, isMilestone: true },
  { id: '2', projectId: '1', title: 'Foundation Work', status: 'in_progress', assignedTo: ['2'], dueDate: '2025-03-15', startDate: '2025-03-02', endDate: '2025-03-15', duration: 13, predecessors: ['1'], order: 1 },
  { id: '3', projectId: '1', title: 'Paving', status: 'not_started', assignedTo: [], dueDate: '2025-04-01', startDate: '2025-03-16', endDate: '2025-04-01', duration: 16, predecessors: ['2'], order: 2, isMilestone: true },
  { id: '4', projectId: '2', title: 'Structural Design', status: 'in_progress', assignedTo: ['1', '2'], dueDate: '2025-03-20', startDate: '2025-03-01', endDate: '2025-03-20', duration: 19, order: 0, isMilestone: true },
]

export const mockInvoices: Invoice[] = [
  { id: '1', projectId: '1', amount: 50000, status: 'paid', createdAt: '2025-02-01' },
  { id: '2', projectId: '1', amount: 75000, status: 'pending', createdAt: '2025-03-01' },
  { id: '3', projectId: '2', amount: 100000, status: 'pending', createdAt: '2025-03-10' },
]

export const mockPayments: Payment[] = [
  { id: '1', invoiceId: '1', amountPaid: 50000, paidAt: '2025-02-15' },
]

export const mockImages: Image[] = [
  {
    id: '1',
    projectId: '1',
    companyId: '1',
    filePath: '/images/sample1.jpg',
    latitude: 40.7128,
    longitude: -74.006,
    timestamp: '2025-03-10T10:00:00Z',
    fileName: 'site_photo_1.jpg',
    uploadedBy: 'Project Manager',
  },
]

export const mockRisks: Risk[] = [
  { id: '1', projectId: '1', description: 'Adverse weather delays construction', probability: 4, impact: 4, severity: 'high', owner: '2', mitigation: 'Buffer days in schedule', status: 'open' },
  { id: '2', projectId: '1', description: 'Material price increase', probability: 3, impact: 3, severity: 'medium', owner: '2', mitigation: 'Fixed-price contracts', status: 'mitigating' },
  { id: '3', projectId: '2', description: 'Design approval delays', probability: 2, impact: 4, severity: 'medium', owner: '1', mitigation: 'Early stakeholder engagement', status: 'open' },
  { id: '4', projectId: '3', description: 'Funding shortfall', probability: 3, impact: 5, severity: 'critical', owner: '1', mitigation: 'Contingency reserve', status: 'open' },
]

export const mockRiskAlerts: RiskAlert[] = [
  { id: '1', projectId: '1', projectName: 'Highway A1 Extension', message: 'Schedule slippage detected (+14 days)', type: 'schedule' as const, severity: 'medium' as const },
  { id: '2', projectId: '3', projectName: 'Railway Station Upgrade', message: 'High cost deviation, adverse weather risk', type: 'cost' as const, severity: 'high' as const },
  { id: '3', projectId: '2', projectName: 'Office Tower Phase 1', message: 'Cost overrun on milestone stage 4', type: 'milestone' as const, severity: 'medium' as const },
]

export const mockRACIEntries: RACIEntry[] = [
  { id: '1', projectId: '1', deliverable: 'Site Survey', responsible: 'Engineer', accountable: 'PM', consulted: ['Client'], informed: ['Admin'] },
  { id: '2', projectId: '1', deliverable: 'Foundation Work', responsible: 'Contractor', accountable: 'PM', consulted: ['Engineer'], informed: ['Client'] },
]

export const mockStakeholders: Stakeholder[] = [
  { id: '1', projectId: '1', name: 'City Council', role: 'Client', power: 5, interest: 5, strategy: 'Manage closely' },
  { id: '2', projectId: '1', name: 'Residents', role: 'End users', power: 2, interest: 4, strategy: 'Keep informed' },
]

export const mockRAIDItems: RAIDItem[] = [
  { id: '1', projectId: '1', type: 'risk', title: 'Weather delays', description: 'Adverse weather', owner: 'PM', status: 'open' },
  { id: '2', projectId: '1', type: 'assumption', title: 'Permits on time', description: 'All permits approved by Q1', owner: 'PM', status: 'open' },
  { id: '3', projectId: '1', type: 'issue', title: 'Material shortage', description: 'Steel delivery delayed', owner: 'PM', status: 'mitigating' },
  { id: '4', projectId: '1', type: 'dependency', title: 'City Council approval', description: 'Budget approval required', owner: 'PM', status: 'resolved' },
]

export const mockCostBenefitAnalyses: CostBenefitAnalysis[] = [
  { id: '1', projectId: '1', costs: [{ description: 'Construction', amount: 500000 }, { description: 'Permits', amount: 25000 }], benefits: [{ description: 'Toll revenue (5yr)', amount: 600000 }, { description: 'Economic growth', amount: 100000 }], roi: 15.4, paybackPeriod: 3.2, recommendation: 'Proceed' },
]

export const mockResources: Resource[] = [
  { id: '1', projectId: '1', type: 'personnel', name: 'Site Engineers', quantity: 3, unit: 'people' },
  { id: '2', projectId: '1', type: 'equipment', name: 'Excavators', quantity: 2, unit: 'units' },
  { id: '3', projectId: '1', type: 'material', name: 'Concrete', quantity: 500, unit: 'cubic meters' },
  { id: '4', projectId: '2', type: 'personnel', name: 'Architects', quantity: 2, unit: 'people' },
]

export const mockCostCategories: CostCategory[] = [
  { id: '1', projectId: '1', name: 'Labor', parentId: undefined, budget: 200000, actualCost: 210000 },
  { id: '2', projectId: '1', name: 'Materials', parentId: undefined, budget: 150000, actualCost: 155000 },
  { id: '3', projectId: '1', name: 'Equipment', parentId: undefined, budget: 100000, actualCost: 98000 },
  { id: '4', projectId: '1', name: 'Subcontractors', parentId: undefined, budget: 50000, actualCost: 57000 },
]

export const mockTimesheetEntries: TimesheetEntry[] = [
  { id: '1', projectId: '1', taskId: '1', userId: '2', hours: 8, date: '2025-02-20', description: 'Site survey' },
  { id: '2', projectId: '1', taskId: '2', userId: '2', hours: 6, date: '2025-03-05', description: 'Foundation prep' },
  { id: '3', projectId: '2', taskId: '4', userId: '1', hours: 4, date: '2025-03-12', description: 'Design review' },
]

export const mockChangeRequests: ChangeRequest[] = [
  { id: '1', projectId: '1', title: 'Extend timeline by 2 weeks', reason: 'Weather delays', requester: 'Project Manager', requestedAt: '2025-03-01T10:00:00Z', impactScope: 'Minor', impactSchedule: '+14 days', impactBudget: '$5k', status: 'approved', approvalStep: 'approved', approvedBy: 'Admin User', approvedAt: '2025-03-02T14:00:00Z' },
  { id: '2', projectId: '2', title: 'Add basement level', reason: 'Client request', requester: 'Admin User', requestedAt: '2025-03-10T09:00:00Z', impactScope: 'Major', impactSchedule: '+4 weeks', impactBudget: '$200k', status: 'pending', approvalStep: 'submitted' },
]

export const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Admin User', action: 'budget_updated', entityType: 'budget', projectId: '1', projectName: 'Highway A1 Extension', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', userId: '2', userName: 'Project Manager', action: 'task_created', entityType: 'task', projectId: '1', projectName: 'Highway A1 Extension', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: '3', userId: '2', userName: 'Project Manager', action: 'workflow_changed', entityType: 'workflow', projectId: '2', projectName: 'Office Tower Phase 1', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: '4', userId: '1', userName: 'Admin User', action: 'document_uploaded', entityType: 'document', projectId: '1', projectName: 'Highway A1 Extension', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
]

export const mockNotifications: Notification[] = [
  { id: '1', type: 'risk', title: 'High risk alert', message: 'Funding shortfall risk on Railway Station Upgrade', projectId: '3', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', type: 'change', title: 'Change request pending', message: 'Add basement level - awaiting approval', projectId: '2', read: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: '3', type: 'milestone', title: 'Milestone completed', message: 'Site Survey completed for Highway A1 Extension', projectId: '1', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
]

export const mockDocuments: Document[] = [
  { id: '1', projectId: '1', taskId: '1', name: 'Site Survey Report.pdf', type: 'application/pdf', version: 1, uploadedAt: '2025-02-20T10:00:00Z', uploadedBy: '2' },
  { id: '2', projectId: '1', name: 'Project Charter.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', version: 2, uploadedAt: '2025-02-01T09:00:00Z', uploadedBy: '1' },
  { id: '3', projectId: '1', taskId: '2', name: 'Foundation Specs.pdf', type: 'application/pdf', version: 1, uploadedAt: '2025-03-05T14:30:00Z', uploadedBy: '2' },
  { id: '4', projectId: '2', name: 'Design Brief.pdf', type: 'application/pdf', version: 1, uploadedAt: '2025-03-01T11:00:00Z', uploadedBy: '1' },
]

export const mockBaselines: ProjectBaseline[] = [
  { id: '1', projectId: '1', baselineDate: '2025-02-01', budget: 500000, plannedEndDate: '2025-06-01', scheduleSnapshot: [{ taskId: '1', startDate: '2025-02-15', endDate: '2025-03-01' }, { taskId: '2', startDate: '2025-03-02', endDate: '2025-03-15' }, { taskId: '3', startDate: '2025-03-16', endDate: '2025-04-01' }] },
  { id: '2', projectId: '2', baselineDate: '2025-03-01', budget: 2000000, plannedEndDate: '2025-12-31', scheduleSnapshot: [{ taskId: '4', startDate: '2025-03-01', endDate: '2025-03-20' }] },
]

export const mockKPIs: DashboardKPIs = {
  totalProjects: 3,
  activeProjects: 2,
  onTrackCount: 1,
  atRiskCount: 2,
  completionRate: 35,
  totalBudget: 3300000,
  totalPaid: 50000,
  outstandingBalance: 175000,
  aggregateVariance: -20000,
}
