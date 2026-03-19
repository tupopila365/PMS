import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Select, Tabs, Button } from 'antd'
import { UploadOutlined, PictureOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { mediaService } from '../../services/mediaService'
import { ImageMapView } from '../../components/map/ImageMapView'
import { ImageCard } from '../../components/media/ImageCard'
import { projectService } from '../../services/projectService'
import { PageHeader } from '../../components/layout/PageHeader'

export function MediaGallery() {
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<string | undefined>()
  const { data: images } = useQuery({
    queryKey: ['images', projectId],
    queryFn: () => mediaService.getImages(projectId),
  })
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  })

  const tabItems = [
    { key: 'grid', label: 'Gallery', icon: <PictureOutlined />, children: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {images?.map((img) => (
          <ImageCard key={img.id} image={img} />
        ))}
        {(!images || images.length === 0) && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No images</div>}
      </div>
    )},
    { key: 'map', label: 'Map', icon: <PictureOutlined />, children: <ImageMapView images={images || []} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Media Gallery"
        actions={
          <>
            <Select
              placeholder="Filter by project"
              style={{ width: 200, marginRight: 8 }}
              options={projects?.map((p) => ({ value: p.id, label: p.name }))}
              value={projectId}
              onChange={setProjectId}
              allowClear
            />
            <Button icon={<UploadOutlined />} onClick={() => navigate('/media')}>Upload</Button>
          </>
        }
      />
      <Card styles={{ body: { padding: 16 } }}>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
