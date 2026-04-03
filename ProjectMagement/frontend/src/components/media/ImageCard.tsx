import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Image, Input, message } from 'antd'
import type { AxiosError } from 'axios'
import { CalendarOutlined, CloudUploadOutlined, UserOutlined, EnvironmentOutlined, CommentOutlined } from '@ant-design/icons'
import type { Image as ImageType, ImageComment } from '../../types'
import { mediaService } from '../../services/mediaService'
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

function commentLabel(c: ImageComment): string {
  if (c.kind === 'upload_note') return 'Upload note'
  return 'Comment'
}

export function ImageCard({ image }: ImageCardProps) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const addComment = useMutation({
    mutationFn: (text: string) => mediaService.addImageComment(image.id, text),
    onSuccess: (updated) => {
      setDraft('')
      queryClient.setQueriesData<ImageType[]>({ queryKey: ['images'] }, (old) => {
        if (!old) return old
        return old.map((img) => (img.id === updated.id ? { ...img, ...updated } : img))
      })
      void queryClient.invalidateQueries({ queryKey: ['images'] })
    },
    onError: (err: Error) => {
      const ax = err as AxiosError<{ message?: string; error?: string }>
      const status = ax.response?.status
      const body = ax.response?.data
      const detail =
        (typeof body?.message === 'string' && body.message) ||
        (typeof body?.error === 'string' && body.error) ||
        ax.message
      if (status === 401) {
        message.error('You must be logged in to comment.')
      } else if (status === 404) {
        message.error('Image not found. Try refreshing the page.')
      } else if (status === 400) {
        message.error(detail || 'Invalid comment.')
      } else {
        message.error(detail || 'Could not post comment. Check the API URL and network.')
      }
    },
  })

  const src = imageSrc(image)
  const hasLocation = image.latitude != null && image.longitude != null
  const thread = image.comments?.length
    ? image.comments
    : image.comment?.trim()
      ? [
          {
            id: 'legacy',
            text: image.comment.trim(),
            authorName: image.uploadedBy || 'Uploader',
            createdAt: image.uploadedAt || image.timestamp || '',
            kind: 'upload_note',
          } satisfies ImageComment,
        ]
      : []

  // `capturedAt`: camera EXIF when capturedFromExif; else server fills with upload time for new uploads.
  const takenFormatted = formatWhen(image.capturedAt)
  const photoTaken =
    takenFormatted == null
      ? 'Not embedded in file (no EXIF date — e.g. PNG, screenshot, or metadata stripped)'
      : image.capturedFromExif === true
        ? `${takenFormatted} (camera)`
        : image.capturedFromExif === false
          ? `${takenFormatted} (upload time — no camera date in file)`
          : `${takenFormatted}`

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
        <div className="mt-3 pt-2 border-t border-[var(--border-muted)]">
          <div className="flex items-center gap-1.5 text-[var(--text-primary)]/90 font-medium text-xs mb-2">
            <CommentOutlined />
            Comments
          </div>
          {thread.length === 0 ? (
            <p className="text-[var(--text-muted)] italic mb-2">No comments yet.</p>
          ) : (
            <ul className="space-y-2 mb-2 max-h-40 overflow-y-auto">
              {thread.map((c) => (
                <li key={c.id} className="text-xs rounded bg-[var(--surface-elevated)]/50 px-2 py-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 text-[var(--text-muted)]">
                    <span className="text-[var(--text-primary)] font-medium">{c.authorName}</span>
                    <span className="opacity-80">{commentLabel(c)}</span>
                    {c.createdAt ? (
                      <span className="opacity-70">{formatWhen(c.createdAt) || c.createdAt}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[var(--text-primary)]">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
          <Input.TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            disabled={addComment.isPending}
            className="text-xs"
          />
          <Button
            type="primary"
            htmlType="button"
            size="small"
            className="mt-2"
            loading={addComment.isPending}
            disabled={!draft.trim()}
            onClick={() => addComment.mutate(draft.trim())}
          >
            Post comment
          </Button>
        </div>
      </div>
    </Card>
  )
}
