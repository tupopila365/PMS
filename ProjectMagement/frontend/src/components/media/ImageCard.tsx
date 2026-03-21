import { Card, Image } from 'antd'
import { CalendarOutlined, CloudUploadOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons'
import type { Image as ImageType } from '../../types'
import { resolveApiUrl } from '../../utils/resolveApiUrl'

const BROKEN_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="system-ui" font-size="14">Image</text></svg>`
  )

function imageSrc(image: ImageType): string {
  const path = image.filePath?.trim() || `/api/images/file/${image.id}`
  return resolveApiUrl(path)
}

function formatLocation(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`
}

function formatWhen(iso?: string): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

interface ImageCardProps {
  image: ImageType
}

export function ImageCard({ image }: ImageCardProps) {
  const src = imageSrc(image)
  const hasLocation = image.latitude != null && image.longitude != null

  // Photo taken = EXIF only (server field `capturedAt`)
  const photoTaken =
    formatWhen(image.capturedAt) ||
    'Not embedded in file (no EXIF date — e.g. PNG, screenshot, or metadata stripped)'

  // Uploaded = server clock when the file hit CBMP
  const uploaded =
    formatWhen(image.uploadedAt) ||
    (image.timestamp ? `${formatWhen(image.timestamp)} (legacy record)` : '—')

  return (
    <Card
      size="small"
      cover={
        <Image
          alt={image.fileName || image.filePath || 'Photo'}
          src={src}
          fallback={BROKEN_IMG}
          style={{ height: 150, width: '100%', objectFit: 'cover' }}
          preview={{ mask: 'Click to zoom' }}
        />
      }
    >
      <div className="text-sm text-[var(--text-primary)] font-medium truncate" title={image.fileName || image.filePath}>
        {image.fileName || image.filePath}
      </div>
      <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
        <div className="flex items-start gap-2">
          <CalendarOutlined className="opacity-70 mt-0.5" />
          <span>
            <span className="text-[var(--text-primary)]/80">Photo taken:</span> {photoTaken}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <CloudUploadOutlined className="opacity-70 mt-0.5" />
          <span>
            <span className="text-[var(--text-primary)]/80">Uploaded:</span> {uploaded}
          </span>
        </div>
        {image.uploadedBy && (
          <div className="flex items-center gap-2">
            <UserOutlined className="opacity-70" />
            <span>By: {image.uploadedBy}</span>
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
            <span>No GPS in file</span>
          </div>
        )}
      </div>
    </Card>
  )
}
