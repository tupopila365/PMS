import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultLandingPath } from '../utils/permissions'
import type { UserRole } from '../types'
import { AppLayout } from '../components/layout/AppLayout'
import { PageLoader } from '../components/ui/PageLoader'
import { Login } from '../pages/auth/Login'
import { Dashboard } from '../pages/dashboard/Dashboard'
import { ProjectPortfolio } from '../pages/portfolio/ProjectPortfolio'
import { ProjectPipeline } from '../pages/portfolio/ProjectPipeline'
import { BoqCompare } from '../pages/portfolio/BoqCompare'
import { ProjectList } from '../pages/projects/ProjectList'
import { ProjectDetail } from '../pages/projects/ProjectDetail'
import { ProjectCreate } from '../pages/projects/ProjectCreate'
import { ProjectWBS } from '../pages/projects/ProjectWBS'
import { ProjectCBS } from '../pages/projects/ProjectCBS'
import { ProjectRBS } from '../pages/projects/ProjectRBS'
import { ProjectEVM } from '../pages/projects/ProjectEVM'
import { ProjectCostBenefit } from '../pages/projects/ProjectCostBenefit'
import { ProjectRACI } from '../pages/projects/ProjectRACI'
import { ProjectStakeholders } from '../pages/projects/ProjectStakeholders'
import { TaskList } from '../pages/tasks/TaskList'
import { TaskBoard } from '../pages/tasks/TaskBoard'
import { GanttView } from '../pages/tasks/GanttView'
import { NetworkView } from '../pages/tasks/NetworkView'
import { RiskRegister } from '../pages/risks/RiskRegister'
import { ChangeLog } from '../pages/changes/ChangeLog'
import { Timesheets } from '../pages/timesheets/Timesheets'
import { RAIDLog } from '../pages/raid/RAIDLog'
import { UploadPage } from '../pages/media/UploadPage'
import { MediaGallery } from '../pages/media/MediaGallery'
import { Invoices } from '../pages/finance/Invoices'
import { Payments } from '../pages/finance/Payments'
import { Reports } from '../pages/reports/Reports'
import { Documents } from '../pages/documents/Documents'
import { CompanySettings } from '../pages/admin/CompanySettings'
import { UserManagement } from '../pages/admin/UserManagement'
import { SubscriptionSettings } from '../pages/admin/SubscriptionSettings'
import { RolePermissions } from '../pages/admin/RolePermissions'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
        <PageLoader />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Post-login home: role-based (e.g. vendor → /projects, not /dashboard). */
function DefaultLandingRedirect() {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={getDefaultLandingPath(user.role as UserRole)} replace />
}

export function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <DefaultLandingRedirect /> : <Login />
      } />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DefaultLandingRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<ProjectPortfolio />} />
        <Route path="portfolio/pipeline" element={<ProjectPipeline />} />
        <Route path="portfolio/boq-compare" element={<BoqCompare />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectCreate />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/wbs" element={<ProjectWBS />} />
        <Route path="projects/:id/cost-breakdown" element={<ProjectCBS />} />
        <Route path="projects/:id/resources" element={<ProjectRBS />} />
        <Route path="projects/:id/evm" element={<ProjectEVM />} />
        <Route path="projects/:id/cost-benefit" element={<ProjectCostBenefit />} />
        <Route path="projects/:id/raid" element={<RAIDLog />} />
        <Route path="projects/:id/raci" element={<ProjectRACI />} />
        <Route path="projects/:id/stakeholders" element={<ProjectStakeholders />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/board" element={<TaskBoard />} />
        <Route path="tasks/gantt" element={<GanttView />} />
        <Route path="tasks/network" element={<NetworkView />} />
        <Route path="risks" element={<RiskRegister />} />
        <Route path="changes" element={<ChangeLog />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="media" element={<UploadPage />} />
        <Route path="media/gallery" element={<MediaGallery />} />
        <Route path="documents" element={<Documents />} />
        <Route path="finance/invoices" element={<Invoices />} />
        <Route path="finance/payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin/company" element={<CompanySettings />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/roles" element={<RolePermissions />} />
        <Route path="admin/subscription" element={<SubscriptionSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
