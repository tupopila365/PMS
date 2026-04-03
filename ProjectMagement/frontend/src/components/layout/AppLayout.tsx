import { useState, useMemo, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Breadcrumb, Dropdown, Avatar, Select, Badge } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../services/projectService'
import { ProjectProvider, useProjectContext } from '../../context/ProjectContext'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  PictureOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  FileTextOutlined,
  FileOutlined,
  BellOutlined,
  WarningOutlined,
  SunOutlined,
  MoonOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useNotifications } from '../../context/NotificationContext'
import { useTheme } from '../../theme/ThemeContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { RouteGuard } from '../auth/RouteGuard'
import { NotificationListItem } from '../notifications/NotificationListItem'

const { Header, Sider, Content } = Layout

function buildMenuItems(can: (p: import('../../utils/permissions').Permission) => boolean) {
  const items: { key: string; icon?: React.ReactNode; label: string; children?: { key: string; label: string }[] }[] = []
  if (can('dashboard:view')) items.push({ key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' })
  if (can('portfolio:view')) {
    items.push({ key: '/portfolio', icon: <AppstoreOutlined />, label: 'Project Portfolio' })
    items.push({ key: '/portfolio/pipeline', icon: <ProjectOutlined />, label: 'Pipeline' })
    items.push({ key: '/portfolio/boq-compare', icon: <FileOutlined />, label: 'BOQ compare' })
  }
  if (can('projects:view')) items.push({ key: '/projects', icon: <ProjectOutlined />, label: 'Projects' })
  if (can('tasks:view')) {
    items.push({
      key: 'tasks',
      icon: <CheckSquareOutlined />,
      label: 'Tasks',
      children: [
        { key: '/tasks', label: 'List' },
        { key: '/tasks/board', label: 'Board' },
        { key: '/tasks/gantt', label: 'Gantt' },
        { key: '/tasks/network', label: 'Network' },
      ],
    })
  }
  if (can('risks:view')) items.push({ key: '/risks', icon: <WarningOutlined />, label: 'Risks' })
  if (can('changes:view')) items.push({ key: '/changes', icon: <FileTextOutlined />, label: 'Change Log' })
  if (can('timesheets:view')) items.push({ key: '/timesheets', icon: <ClockCircleOutlined />, label: 'Timesheets' })
  if (can('media:view')) items.push({ key: '/media', icon: <PictureOutlined />, label: 'Media' })
  if (can('documents:view')) items.push({ key: '/documents', icon: <FileOutlined />, label: 'Documents' })
  if (can('finance:view')) {
    const financeChildren = [
      ...(can('finance:invoices') ? [{ key: '/finance/invoices', label: 'Invoices' }] : []),
      ...(can('finance:payments') ? [{ key: '/finance/payments', label: 'Payments' }] : []),
    ] as { key: string; label: string }[]
    if (financeChildren.length > 0) {
      items.push({
        key: 'finance',
        icon: <DollarOutlined />,
        label: 'Finance',
        children: financeChildren,
      })
    }
  }
  if (can('reports:view')) items.push({ key: '/reports', icon: <BarChartOutlined />, label: 'Reports' })
  if (can('admin:company') || can('admin:users') || can('admin:roles') || can('admin:subscription')) {
    items.push({
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Admin',
      children: [
        ...(can('admin:company') ? [{ key: '/admin/company', label: 'Company' }] : []),
        ...(can('admin:users') ? [{ key: '/admin/users', label: 'Users' }] : []),
        ...(can('admin:roles') ? [{ key: '/admin/roles', label: 'Role Permissions' }] : []),
        ...(can('admin:subscription') ? [{ key: '/admin/subscription', label: 'Subscription' }] : []),
      ].filter(Boolean) as { key: string; label: string }[],
    })
  }
  return items
}

/** Human-readable crumb titles for URL segments (falls back to Title Case). */
const BREADCRUMB_SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  portfolio: 'Project Portfolio',
  pipeline: 'Pipeline',
  'boq-compare': 'BOQ compare',
  projects: 'Projects',
  tasks: 'Tasks',
  board: 'Board',
  gantt: 'Gantt',
  network: 'Network',
  risks: 'Risks',
  changes: 'Change Log',
  timesheets: 'Timesheets',
  media: 'Media',
  gallery: 'Gallery',
  documents: 'Documents',
  finance: 'Finance',
  invoices: 'Invoices',
  payments: 'Payments',
  reports: 'Reports',
  admin: 'Admin',
  company: 'Company',
  users: 'Users',
  roles: 'Role Permissions',
  subscription: 'Subscription',
  new: 'New',
}

function formatBreadcrumbSegment(seg: string): string {
  const mapped = BREADCRUMB_SEGMENT_LABELS[seg.toLowerCase()]
  if (mapped) return mapped
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    title: formatBreadcrumbSegment(seg),
    path: '/' + segments.slice(0, i + 1).join('/'),
  }))
}

function AppLayoutInner() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [collapsed, setCollapsed] = useState(isMobile)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const { toggleTheme, isDark } = useTheme()
  const { notifications, markRead, markAllRead } = useNotifications()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const filteredNotifications = useMemo(() => {
    if (!selectedProjectId) return notifications
    return notifications.filter((n) => !n.projectId || n.projectId === selectedProjectId)
  }, [notifications, selectedProjectId])
  const filteredUnreadCount = useMemo(
    () => filteredNotifications.filter((n) => !n.read).length,
    [filteredNotifications],
  )
  const menuItems = useMemo(() => buildMenuItems(can), [can])
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname
  const breadcrumbs = getBreadcrumbs(location.pathname)
  /** Gantt needs a non-scrolling outlet so flex + ResizeObserver get a real height (scroll stays inside the chart). */
  const isGanttPage = location.pathname === '/tasks/gantt'

  // Keep collapsed on mobile when resizing
  useEffect(() => {
    if (isMobile) setCollapsed(true)
  }, [isMobile])

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: (info: { key: string }) => {
      if (info.key === 'logout') {
        logout()
        navigate('/login')
      }
    },
  }

  return (
    <Layout className="h-screen max-h-screen overflow-hidden flex bg-[var(--page-bg)]">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={72}
        className="app-layout-sider"
      >
        <div className="flex flex-col h-full min-h-0 max-h-[100vh]">
          <div className="app-layout-sider-brand h-16 flex items-center justify-center font-semibold text-lg shrink-0 border-b border-[var(--sider-border)] text-[#fafaf9]">
            {collapsed ? (
              <span className="text-sm">CBMP</span>
            ) : (
              <span className="tracking-tight">CBMP</span>
            )}
          </div>
          <nav className="app-layout-sider-nav flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain sidebar-scroll" aria-label="Main navigation">
            <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['admin', 'finance', 'tasks']}
            items={menuItems}
            onClick={({ key }) => {
              if (!key.startsWith('/')) return
              navigate(key)
              if (isMobile) setCollapsed(true)
            }}
            className="app-layout-sider-menu mt-2 border-none bg-transparent pb-4 [&_.ant-menu-item]:rounded-lg [&_.ant-menu-item]:mx-2 [&_.ant-menu-submenu-title]:rounded-lg [&_.ant-menu-submenu-title]:mx-2"
            style={{ background: 'transparent' }}
          />
          </nav>
        </div>
      </Sider>
      <Layout className="flex-1 min-w-0 min-h-0 h-screen max-h-screen flex flex-col overflow-hidden w-full pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
        <Header className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:h-16 sm:gap-0 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm px-3 sm:px-5 lg:px-6 py-3 sm:py-0 [padding-top:max(0.75rem,env(safe-area-inset-top,0px))]">
          <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 lg:gap-4">
            <div className="flex items-center gap-2 w-full min-w-0 sm:w-auto sm:flex-1 sm:min-w-[200px] sm:max-w-xl">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)] touch-manipulation"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
              </button>
              <Select
                placeholder="Project filter"
                allowClear
                className="flex-1 min-w-0 sm:min-w-[160px] sm:flex-initial sm:w-[min(100%,280px)]"
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                options={[{ label: 'All Projects', value: undefined }, ...projects.map((p) => ({ label: p.name, value: p.id }))]}
                popupMatchSelectWidth={false}
                styles={{ popup: { root: { maxWidth: 'min(100vw - 24px, 320px)' } } }}
              />
            </div>
            {!isMobile && (
            <Breadcrumb
              className="min-w-0 [&_.ant-breadcrumb-separator]:mx-1"
              items={breadcrumbs.map((b, i) => ({
                title:
                  i < breadcrumbs.length - 1 ? (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(b.path)
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {b.title}
                    </a>
                  ) : (
                    <span className="text-[var(--text-primary)] font-medium">{b.title}</span>
                  ),
              }))}
            />
            )}
          </div>
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 w-full sm:w-auto [padding-bottom:env(safe-area-inset-bottom,0px)] sm:pb-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)] touch-manipulation"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
            </button>
            <Dropdown
              dropdownRender={() => (
                <div className="bg-[var(--surface)] rounded-xl shadow-lg w-[min(calc(100vw-1.5rem),360px)] sm:min-w-[300px] max-h-[min(70vh,400px)] overflow-auto border border-[var(--border)]">
                  <div className="p-3 border-b border-[var(--border)] flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">Notifications</span>
                    {filteredUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-sm text-[var(--color-primary)] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {filteredNotifications.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)]">No notifications</div>
                  ) : (
                    filteredNotifications.slice(0, 8).map((n) => (
                      <NotificationListItem key={n.id} n={n} onMarkRead={markRead} />
                    ))
                  )}
                </div>
              )}
              trigger={['click']}
            >
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)] relative touch-manipulation"
                aria-label="Notifications"
              >
                <Badge count={filteredUnreadCount} size="small">
                  <BellOutlined className="text-lg" />
                </Badge>
              </button>
            </Dropdown>
            <Dropdown menu={userMenu} placement="bottomRight">
              <button
                type="button"
                className="flex items-center gap-2 min-h-11 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-muted)] transition-colors cursor-pointer touch-manipulation"
              >
                <Avatar size="small" icon={<UserOutlined />} className="bg-primary" />
                <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">{user?.name}</span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content
          className={
            isGanttPage
              ? 'flex-1 min-h-0 flex flex-col overflow-hidden overscroll-contain m-2 p-3 sm:m-4 sm:p-4 md:m-5 md:p-5 bg-[var(--surface)] rounded-lg sm:rounded-xl border border-[var(--border)] shadow-sm min-w-0 mb-[max(0.5rem,env(safe-area-inset-bottom,0px))]'
              : 'flex-1 min-h-0 flex flex-col overflow-hidden overscroll-contain m-2 p-3 sm:m-4 sm:p-5 md:m-6 md:p-6 bg-[var(--surface)] rounded-lg sm:rounded-xl border border-[var(--border)] shadow-sm min-w-0 mb-[max(0.5rem,env(safe-area-inset-bottom,0px))]'
          }
        >
          <RouteGuard>
            <div
              className={
                isGanttPage
                  ? 'flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden'
                  : 'flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden min-w-0'
              }
            >
              <Outlet />
            </div>
          </RouteGuard>
        </Content>
      </Layout>
    </Layout>
  )
}

export function AppLayout() {
  return (
    <ProjectProvider>
      <AppLayoutInner />
    </ProjectProvider>
  )
}
