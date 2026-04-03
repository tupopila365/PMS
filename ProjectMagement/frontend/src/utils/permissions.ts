import type { UserRole } from '../types'

/**
 * RBAC model (cohesion note)
 * -------------------------
 * - **RouteGuard** uses `canAccessRoute()` below: one coarse permission per URL prefix. Most “edit vs view” lives on the
 *   same SPA path (e.g. project detail), so RouteGuard cannot distinguish them.
 * - **Sidebar / buttons** use `hasPermission()` via `usePermissions().can()` for finer gates (`projects:edit`,
 *   `tasks:delete`, `changes:approve`, etc.).
 * - **Backend** remains the source of truth for mutating APIs.
 *
 * **Portfolio routes**: a single `/portfolio` row matches `/portfolio`, `/portfolio/pipeline`, `/portfolio/boq-compare`, etc.
 * If a sub-path ever needs a *different* permission, add a dedicated row **immediately above** the `/portfolio` row.
 *
 * Permissions not referenced in `canAccessRoute` are intentional: they gate menus, inline actions, or future routes.
 */
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

/** First allowed path for post-login and RouteGuard fallback (roles without `dashboard:view` skip dashboard). */
export function getDefaultLandingPath(role: UserRole): string {
  const candidates: [string, Permission][] = [
    ['/dashboard', 'dashboard:view'],
    ['/portfolio', 'portfolio:view'],
    ['/projects', 'projects:view'],
    ['/tasks', 'tasks:view'],
    ['/finance/invoices', 'finance:invoices'],
    ['/finance/payments', 'finance:payments'],
    ['/timesheets', 'timesheets:view'],
    ['/documents', 'documents:view'],
    ['/media', 'media:view'],
    ['/risks', 'risks:view'],
    ['/reports', 'reports:view'],
    ['/changes', 'changes:view'],
  ]
  for (const [path, perm] of candidates) {
    if (hasPermission(role, perm)) {
      return path
    }
  }
  return '/projects'
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  // More specific routes first (order matters — especially under /portfolio and /projects).
  const routePermissions: [string, Permission][] = [
    ['/projects/new', 'projects:create'],
    ['/dashboard', 'dashboard:view'],
    ['/portfolio', 'portfolio:view'],
    ['/projects', 'projects:view'],
    ['/tasks/board', 'tasks:view'],
    ['/tasks/gantt', 'tasks:view'],
    ['/tasks/network', 'tasks:view'],
    ['/tasks', 'tasks:view'],
    ['/risks', 'risks:view'],
    ['/changes', 'changes:view'],
    ['/media/gallery', 'media:view'],
    ['/media', 'media:view'],
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
