import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, Table, InputNumber } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageHeader } from '../../components/layout/PageHeader'
import { costBenefitService } from '../../services/costBenefitService'
import { projectService } from '../../services/projectService'
import type { CostBenefitAnalysis, CostBenefitItem } from '../../types'
import { useState, useEffect } from 'react'

export function ProjectCostBenefit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [costs, setCosts] = useState<CostBenefitItem[]>([{ description: '', amount: 0 }])
  const [benefits, setBenefits] = useState<CostBenefitItem[]>([{ description: '', amount: 0 }])

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  const { data: analysis } = useQuery({
    queryKey: ['cost-benefit', id],
    queryFn: () => costBenefitService.getAnalysis(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (analysis) {
      setCosts(analysis.costs.length ? analysis.costs : [{ description: '', amount: 0 }])
      setBenefits(analysis.benefits.length ? analysis.benefits : [{ description: '', amount: 0 }])
    }
  }, [analysis])

  const saveMutation = useMutation({
    mutationFn: (a: CostBenefitAnalysis) => costBenefitService.saveAnalysis(a),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cost-benefit', id] }),
  })

  const totalCosts = costs.reduce((s, c) => s + c.amount, 0)
  const totalBenefits = benefits.reduce((s, b) => s + b.amount, 0)
  const roi = totalCosts > 0 ? ((totalBenefits - totalCosts) / totalCosts) * 100 : 0

  const handleSave = () => {
    if (!id) return
    saveMutation.mutate({
      id: analysis?.id || 'cba-' + Date.now(),
      projectId: id,
      costs,
      benefits,
      roi,
      recommendation: totalBenefits >= totalCosts ? 'Proceed' : 'Review',
    })
  }

  if (!id) return <div>Project not found</div>

  return (
    <div>
      <PageHeader
        title="Cost-Benefit Analysis"
        subtitle={project?.name}
        leading={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${id}`)}>
            Back
          </Button>
        }
      />

      <Card title="Costs" style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Table
          dataSource={costs}
          rowKey={(_, i) => `c-${i}`}
          pagination={false}
          columns={[
            { title: 'Description', dataIndex: 'description', key: 'description', render: (_, __, i) => <input value={costs[i]?.description} onChange={(e) => { const c = [...costs]; c[i] = { ...c[i], description: e.target.value }; setCosts(c); }} style={{ width: '100%', border: 'none', borderBottom: '1px solid #d9d9d9' }} /> },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (_, __, i) => <InputNumber value={costs[i]?.amount} onChange={(v) => { const c = [...costs]; c[i] = { ...c[i], amount: v ?? 0 }; setCosts(c); }} style={{ width: '100%' }} prefix="$" /> },
          ]}
        />
        <Button type="dashed" onClick={() => setCosts([...costs, { description: '', amount: 0 }])} style={{ marginTop: 8 }}>Add Cost</Button>
      </Card>

      <Card title="Benefits" style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Table
          dataSource={benefits}
          rowKey={(_, i) => `b-${i}`}
          pagination={false}
          columns={[
            { title: 'Description', dataIndex: 'description', key: 'description', render: (_, __, i) => <input value={benefits[i]?.description} onChange={(e) => { const b = [...benefits]; b[i] = { ...b[i], description: e.target.value }; setBenefits(b); }} style={{ width: '100%', border: 'none', borderBottom: '1px solid #d9d9d9' }} /> },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (_, __, i) => <InputNumber value={benefits[i]?.amount} onChange={(v) => { const b = [...benefits]; b[i] = { ...b[i], amount: v ?? 0 }; setBenefits(b); }} style={{ width: '100%' }} prefix="$" /> },
          ]}
        />
        <Button type="dashed" onClick={() => setBenefits([...benefits, { description: '', amount: 0 }])} style={{ marginTop: 8 }}>Add Benefit</Button>
      </Card>

      <Card styles={{ body: { padding: 16 } }}>
        <p><strong>Total Costs:</strong> ${totalCosts.toLocaleString()}</p>
        <p><strong>Total Benefits:</strong> ${totalBenefits.toLocaleString()}</p>
        <p><strong>ROI:</strong> {roi.toFixed(1)}%</p>
        <p><strong>Recommendation:</strong> {totalBenefits >= totalCosts ? 'Proceed' : 'Review'}</p>
        <Button type="primary" onClick={handleSave}>Save Analysis</Button>
      </Card>
    </div>
  )
}
