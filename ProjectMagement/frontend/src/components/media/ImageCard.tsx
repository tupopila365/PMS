import { Card, Image } from 'antd'
import { CalendarOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { Image as ImageType } from '../../types'

function formatLocation(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`
}

interface ImageCardProps {
  image: ImageType
}

export function ImageCard({ image }: ImageCardProps) {
  const imgSrc = image.filePath?.startsWith('http')
    ? image.filePath
    : image.filePath?.startsWith('/')
      ? `${import.meta.env.VITE_API_URL || ''}${image.filePath}`
      : `https://picsum.photos/seed/${image.id}/400/300`

  const hasLocation = image.latitude != null && image.longitude != null

  return (
    <Card
      size="small"
      cover={
        <Image
          alt={image.fileName || image.filePath}
          src={imgSrc}
          fallback={`https://picsum.photos/seed/${image.id}/400/300`}
          style={{ height: 150, width: '100%', objectFit: 'cover' }}
          preview={{ mask: 'Click to zoom' }}
        />
      }
    >
      <div className="text-sm text-[var(--text-primary)] font-medium truncate" title={image.fileName || image.filePath}>
        {image.fileName || image.filePath}
      </div>
      <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
        {image.timestamp && (
          <div className="flex items-center gap-2">
            <CalendarOutlined className="opacity-70" />
            <span>Date taken: {new Date(image.timestamp).toLocaleString()}</span>
          </div>
        )}
        {image.uploadedBy && (
          <div className="flex items-center gap-2">
            <UserOutlined className="opacity-70" />
            <span>Uploaded by: {image.uploadedBy}</span>
          </div>
        )}
        {hasLocation ? (
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="opacity-70" />
            <span>Location: {formatLocation(image.latitude!, image.longitude!)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-muted)]/70">
            <EnvironmentOutlined className="opacity-50" />
            <span>Location: Not detected</span>
          </div>
        )}
      </div>
    </Card>
  )
}
