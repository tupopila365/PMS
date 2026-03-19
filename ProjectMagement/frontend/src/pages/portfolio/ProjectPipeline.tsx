import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Row, Col } from 'antd'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'
import type { PipelineStatus } from '../../types'
import { useNavigate } from 'react-router-dom'

const STAGES: { key: PipelineStatus; label: string }[] = [
  { key: 'idea', label: 'Idea' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'planning', label: 'Planning' },
  { key: 'approved', label: 'Approved' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function ProjectPipeline() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PipelineStatus }) => projectService.updateProject(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const byStage = STAGES.reduce<Record<string, typeof projects>>((acc, s) => {
    acc[s.key] = projects.filter((p) => (p.status || 'active') === s.key)
    return acc
  }, {})

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>Project Pipeline</h2>
        <p style={{ color: '#666', margin: 0 }}>Track projects through pipeline stages.</p>
      </div>
      <Row gutter={[16, 16]}>
        {STAGES.map((stage) => (
          <Col xs={24} sm={12} lg={4} key={stage.key}>
            <Card title={`${stage.label} (${byStage[stage.key]?.length || 0})`} size="small" styles={{ body: { padding: 12 } }}>
              {(byStage[stage.key] || []).map((p) => (
                <Card
                  key={p.id}
                  size="small"
                  style={{ marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{p.client || p.type}</div>
                  <select
                    value={p.status || 'active'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateMutation.mutate({ id: p.id, status: e.target.value as PipelineStatus })}
                    style={{ marginTop: 8, width: '100%', padding: 4 }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </Card>
              ))}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
