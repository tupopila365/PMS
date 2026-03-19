import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Select, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ImageUpload } from '../../components/upload/ImageUpload'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'

export function UploadPage() {
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<string | undefined>()
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  return (
    <div>
      <PageHeader
        title="Upload Media"
        actions={
          <Button onClick={() => navigate('/media/gallery')}>View Gallery</Button>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>Project:</label>
          <Select
            placeholder="Select project"
            style={{ width: 300 }}
            options={projects?.map((p) => ({ value: p.id, label: p.name }))}
            value={projectId}
            onChange={setProjectId}
          />
        </div>
        <ImageUpload projectId={projectId || ''} disabled={!projectId} />
      </Card>
    </div>
  )
}
