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

const { Header, Sider, Content } = Layout

function buildMenuItems(can: (p: import('../../utils/permissions').Permission) => boolean) {
  const items: { key: string; icon?: React.ReactNode; label: string; children?: { key: string; label: string }[] }[] = []
  if (can('dashboard:view')) items.push({ key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' })
  if (can('portfolio:view')) {
    items.push({ key: '/portfolio', icon: <AppstoreOutlined />, label: 'Project Portfolio' })
    items.push({ key: '/portfolio/pipeline', icon: <ProjectOutlined />, label: 'Pipeline' })
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
    items.push({
      key: 'finance',
      icon: <DollarOutlined />,
      label: 'Finance',
      children: [
        ...(can('finance:invoices') ? [{ key: '/finance/invoices', label: 'Invoices' }] : []),
        ...(can('finance:payments') ? [{ key: '/finance/payments', label: 'Payments' }] : []),
      ].filter(Boolean) as { key: string; label: string }[],
    })
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

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    title: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
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
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const { selectedProjectId, setSelectedProjectId } = useProjectContext()
  const menuItems = useMemo(() => buildMenuItems(can), [can])
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const selectedKey = location.pathname === '/' ? '/dashboard' : location.pathname
  const breadcrumbs = getBreadcrumbs(location.pathname)

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
        className="app-layout-sider !bg-[#0f172a] border-r border-[#1e293b]"
      >
        <div className="flex flex-col h-full min-h-0 max-h-[100vh]">
          <div className="h-16 flex items-center justify-center text-white font-semibold text-lg shrink-0 border-b border-[#1e293b]/60">
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
            }}
            className="mt-2 border-none bg-transparent pb-4 [&_.ant-menu-item]:rounded-lg [&_.ant-menu-item]:mx-2 [&_.ant-menu-submenu-title]:rounded-lg [&_.ant-menu-submenu-title]:mx-2 [&_.ant-menu-item-selected]:bg-primary/20 [&_.ant-menu-item-selected]:text-white"
            style={{ background: 'transparent' }}
          />
          </nav>
        </div>
      </Sider>
      <Layout className="flex-1 min-w-0 min-h-0 h-screen flex flex-col overflow-hidden">
        <Header className="h-16 shrink-0 px-6 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <Select
              placeholder="Project filter"
              allowClear
              className="min-w-[180px]"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              options={[{ label: 'All Projects', value: undefined }, ...projects.map((p) => ({ label: p.name, value: p.id }))]}
            />
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
            </button>
            {!isMobile && (
            <Breadcrumb
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)]"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
            </button>
            <Dropdown
              dropdownRender={() => (
                <div className="bg-[var(--surface)] rounded-xl shadow-lg min-w-[320px] max-h-[400px] overflow-auto border border-[var(--border)]">
                  <div className="p-3 border-b border-[var(--border)] flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-sm text-[var(--color-primary)] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)]">No notifications</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={`w-full text-left p-3 border-b border-[var(--border-muted)] cursor-pointer transition-colors hover:bg-[var(--surface-muted)] ${
                          !n.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className={`${n.read ? 'font-normal' : 'font-semibold'} text-[var(--text-primary)]`}>
                          {n.title}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-0.5">{n.message}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              trigger={['click']}
            >
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition-colors text-[var(--text-secondary)] relative"
                aria-label="Notifications"
              >
                <Badge count={unreadCount} size="small">
                  <BellOutlined className="text-lg" />
                </Badge>
              </button>
            </Dropdown>
            <Dropdown menu={userMenu} placement="bottomRight">
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
              >
                <Avatar size="small" icon={<UserOutlined />} className="bg-primary" />
                <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">{user?.name}</span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="flex-1 min-h-0 overflow-y-auto overscroll-contain m-6 p-6 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm">
          <RouteGuard>
            <Outlet />
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
