import type { UserRole } from '../types'

export type Permission =
  | 'dashboard:view'
  | 'portfolio:view'
  | 'projects:view'
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  | 'tasks:view'
  | 'tasks:create'
  | 'tasks:edit'
  | 'tasks:delete'
  | 'risks:view'
  | 'risks:create'
  | 'risks:edit'
  | 'changes:view'
  | 'changes:approve'
  | 'media:view'
  | 'media:upload'
  | 'finance:view'
  | 'finance:invoices'
  | 'finance:payments'
  | 'timesheets:view'
  | 'timesheets:create'
  | 'reports:view'
  | 'documents:view'
  | 'documents:upload'
  | 'admin:company'
  | 'admin:users'
  | 'admin:roles'
  | 'admin:subscription'

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard:view', 'portfolio:view', 'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
    'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete', 'risks:view', 'risks:create', 'risks:edit',
    'changes:view', 'changes:approve', 'media:view', 'media:upload', 'finance:view', 'finance:invoices', 'finance:payments',
    'timesheets:view', 'timesheets:create', 'reports:view', 'documents:view', 'documents:upload',
    'admin:company', 'admin:users', 'admin:roles', 'admin:subscription',
  ],
  project_manager: [
    'dashboard:view', 'portfolio:view', 'projects:view', 'projects:create', 'projects:edit',
    'tasks:view', 'tasks:create', 'tasks:edit', 'risks:view', 'risks:create', 'risks:edit',
    'changes:view', 'changes:approve', 'media:view', 'media:upload', 'finance:view', 'finance:invoices', 'finance:payments',
    'timesheets:view', 'timesheets:create', 'reports:view', 'documents:view', 'documents:upload',
  ],
  engineer: [
    'dashboard:view', 'portfolio:view', 'projects:view', 'tasks:view', 'tasks:edit', 'risks:view', 'risks:create',
    'changes:view', 'media:view', 'media:upload', 'timesheets:view', 'timesheets:create', 'reports:view',
    'documents:view', 'documents:upload',
  ],
  contractor: [
    'dashboard:view', 'projects:view', 'tasks:view', 'tasks:edit', 'media:view', 'media:upload',
    'timesheets:view', 'timesheets:create', 'documents:view',
  ],
  accountant: [
    'dashboard:view', 'portfolio:view', 'projects:view', 'finance:view', 'finance:invoices', 'finance:payments',
    'timesheets:view', 'reports:view', 'documents:view',
  ],
  vendor: [
    'projects:view', 'tasks:view', 'media:view', 'documents:view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  // More specific routes first (order matters)
  const routePermissions: [string, Permission][] = [
    ['/projects/new', 'projects:create'],
    ['/dashboard', 'dashboard:view'],
    ['/portfolio', 'portfolio:view'],
    ['/portfolio/pipeline', 'portfolio:view'],
    ['/projects', 'projects:view'],
    ['/tasks', 'tasks:view'],
    ['/tasks/board', 'tasks:view'],
    ['/tasks/gantt', 'tasks:view'],
    ['/tasks/network', 'tasks:view'],
    ['/risks', 'risks:view'],
    ['/changes', 'changes:view'],
    ['/media', 'media:view'],
    ['/media/gallery', 'media:view'],
    ['/finance/invoices', 'finance:invoices'],
    ['/finance/payments', 'finance:payments'],
    ['/timesheets', 'timesheets:view'],
    ['/reports', 'reports:view'],
    ['/documents', 'documents:view'],
    ['/admin/company', 'admin:company'],
    ['/admin/users', 'admin:users'],
    ['/admin/roles', 'admin:roles'],
    ['/admin/subscription', 'admin:subscription'],
  ]
  for (const [route, perm] of routePermissions) {
    if (path === route || path.startsWith(route + '/')) {
      return hasPermission(role, perm)
    }
  }
  return true
}
