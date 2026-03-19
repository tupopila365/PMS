import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Descriptions, Tag, Button, Tabs } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, ApartmentOutlined, DollarOutlined, TeamOutlined, FundOutlined, FileTextOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons'
import { projectService } from '../../services/projectService'
import { baselineService } from '../../services/baselineService'
import { taskService } from '../../services/taskService'
import { TaskTable } from '../../components/tables/TaskTable'
import { ImageMapView } from '../../components/map/ImageMapView'
import { ImageUpload } from '../../components/upload/ImageUpload'
import { ImageCard } from '../../components/media/ImageCard'
import { mediaService } from '../../services/mediaService'
import { financeService } from '../../services/financeService'
import type { ProjectType } from '../../types'
import { useState } from 'react'
import { CreateInvoiceModal } from '../../components/finance/CreateInvoiceModal'
import { RecordPaymentModal } from '../../components/finance/RecordPaymentModal'
import { PageLoader } from '../../components/ui/PageLoader'

const typeLabels: Record<ProjectType, string> = {
  construction: 'Construction',
  roads: 'Roads',
  railway: 'Railway',
  buildings: 'Buildings',
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id && id !== 'new',
  })

  const { data: images } = useQuery({
    queryKey: ['images', id],
    queryFn: () => mediaService.getImages(id),
    enabled: !!id,
  })

  const queryClient = useQueryClient()
  const { data: baselines = [] } = useQuery({
    queryKey: ['baselines', id],
    queryFn: () => baselineService.getBaselines(id),
    enabled: !!id,
  })
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getTasks(id),
    enabled: !!id,
  })
  const createBaselineMutation = useMutation({
    mutationFn: () => baselineService.createBaseline(id!, tasks.map((t) => ({ taskId: t.id, startDate: t.startDate || '', endDate: t.endDate || '' })).filter((s) => s.startDate)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['baselines'] }),
  })
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: financeService.getInvoices,
  })
  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: financeService.getPayments,
  })

  const projectInvoices = invoices?.filter((i) => i.projectId === id) || []
  const projectPayments = payments?.filter((p) =>
    projectInvoices.some((i) => i.id === p.invoiceId)
  ) || []

  if (isLoading || !project) {
    return <PageLoader />
  }

  const quickActions = [
    { icon: <ApartmentOutlined />, label: 'WBS', path: `/projects/${project.id}/wbs` },
    { icon: <DollarOutlined />, label: 'CBS', path: `/projects/${project.id}/cost-breakdown` },
    { icon: <TeamOutlined />, label: 'RBS', path: `/projects/${project.id}/resources` },
    { icon: <FundOutlined />, label: 'EVM', path: `/projects/${project.id}/evm` },
    { icon: <FileTextOutlined />, label: 'Cost-Benefit', path: `/projects/${project.id}/cost-benefit` },
    { icon: <UnorderedListOutlined />, label: 'RAID', path: `/projects/${project.id}/raid` },
    { icon: <UnorderedListOutlined />, label: 'RACI', path: `/projects/${project.id}/raci` },
    { icon: <UserOutlined />, label: 'Stakeholders', path: `/projects/${project.id}/stakeholders` },
  ]

  const tabItems = [
    {
      key: 'tasks',
      label: 'Tasks',
      children: <TaskTable projectId={project.id} />,
    },
    {
      key: 'media',
      label: 'Media',
      children: (
        <div>
          <div className="mb-4">
            <ImageUpload projectId={project.id} />
          </div>
          <div className="mt-6">
            <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">Gallery</h4>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mb-6">
              {images?.map((img) => (
                <ImageCard key={img.id} image={img} />
              ))}
              {(!images || images.length === 0) && <div className="col-span-full text-[var(--text-muted)] py-4">No images</div>}
            </div>
            <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">Map</h4>
            <ImageMapView images={images || []} />
          </div>
        </div>
      ),
    },
    {
      key: 'baseline',
      label: 'Baseline & Variance',
      children: (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h4 className="text-base font-semibold text-[var(--text-primary)] m-0">Baseline Plans</h4>
            <Button type="primary" size="small" onClick={() => createBaselineMutation.mutate()}>Create Baseline</Button>
          </div>
          {baselines.length === 0 ? (
            <div className="text-[var(--text-muted)] py-4">No baselines. Create one to track variance.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {baselines.map((b) => {
                const budgetVar = (project?.actualCost ?? 0) - b.budget
                const scheduleVar = project?.plannedEndDate && b.plannedEndDate ? (new Date(project.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime()) / (24 * 60 * 60 * 1000) : null
                return (
                  <Card key={b.id} size="small" title={`Baseline ${b.baselineDate}`} className="rounded-xl">
                    <table className="w-full border-collapse">
                      <tbody className="text-sm">
                        <tr><td className="py-1">Budget (baseline)</td><td className="text-right">${b.budget.toLocaleString()}</td></tr>
                        <tr><td className="py-1">Actual / Current</td><td className="text-right">${(project?.actualCost ?? 0).toLocaleString()}</td></tr>
                        <tr><td className="py-1">Cost variance</td><td className={`text-right ${budgetVar > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>${budgetVar >= 0 ? '+' : ''}{budgetVar.toLocaleString()}</td></tr>
                        <tr><td className="py-1">Planned end (baseline)</td><td className="text-right">{b.plannedEndDate}</td></tr>
                        <tr><td className="py-1">Schedule variance</td><td className={`text-right ${scheduleVar != null && scheduleVar > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>{scheduleVar != null ? (scheduleVar > 0 ? '+' : '') + Math.round(scheduleVar) + ' days' : '-'}</td></tr>
                      </tbody>
                    </table>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'finance',
      label: 'Finance',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-semibold text-[var(--text-primary)] m-0">Invoices</h4>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setInvoiceModalOpen(true)}>New Invoice</Button>
          </div>
          <Card size="small" className="mb-6 rounded-xl">
            {projectInvoices.length === 0 ? (
              <div className="text-[var(--text-muted)] py-2">No invoices</div>
            ) : (
              <ul className="m-0 pl-5 space-y-1">
                {projectInvoices.map((inv) => (
                  <li key={inv.id} className="text-[var(--text-primary)]">
                    ${inv.amount.toLocaleString()} - <Tag color={inv.status === 'paid' ? 'green' : 'orange'}>{inv.status}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-semibold text-[var(--text-primary)] m-0">Payments</h4>
            <Button size="small" onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>
          </div>
          <Card size="small" className="rounded-xl">
            {projectPayments.length === 0 ? (
              <div className="text-[var(--text-muted)] py-2">No payments</div>
            ) : (
              <ul className="m-0 pl-5 space-y-1">
                {projectPayments.map((p) => (
                  <li key={p.id} className="text-[var(--text-primary)]">${p.amountPaid.toLocaleString()} - {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ''}</li>
                ))}
              </ul>
            )}
          </Card>
          <CreateInvoiceModal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} projectId={project.id} />
          <RecordPaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} invoices={projectInvoices} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} className="mb-4" type="text">
        Back to Projects
      </Button>
      <Card
        title={<span className="text-xl font-semibold text-[var(--text-primary)]">{project.name}</span>}
        className="rounded-xl border border-[var(--border)]"
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {quickActions.map((a) => (
            <Button key={a.path} size="small" icon={a.icon} onClick={() => navigate(a.path)} className="rounded-lg">
              {a.label}
            </Button>
          ))}
        </div>
        <Descriptions column={{ xs: 1, sm: 2 }} className="[&_.ant-descriptions-item-label]:text-[var(--text-secondary)] [&_.ant-descriptions-item-content]:text-[var(--text-primary)]">
          <Descriptions.Item label="Type"><Tag>{typeLabels[project.type]}</Tag></Descriptions.Item>
          <Descriptions.Item label="Status">{project.status || 'Active'}</Descriptions.Item>
          {project.region && <Descriptions.Item label="Region">{project.region}</Descriptions.Item>}
          {project.client && <Descriptions.Item label="Client">{project.client}</Descriptions.Item>}
          {project.riskLevel && <Descriptions.Item label="Risk"><Tag color={project.riskLevel === 'low' ? 'green' : project.riskLevel === 'medium' ? 'orange' : 'red'}>{project.riskLevel}</Tag></Descriptions.Item>}
          {project.budget && <Descriptions.Item label="Budget">${project.budget.toLocaleString()}</Descriptions.Item>}
          {project.actualCost != null && <Descriptions.Item label="Actual Cost">${project.actualCost.toLocaleString()}</Descriptions.Item>}
        </Descriptions>
        <Tabs items={tabItems} className="mt-6 [&_.ant-tabs-nav]:mb-4" />
      </Card>
    </div>
  )
}
