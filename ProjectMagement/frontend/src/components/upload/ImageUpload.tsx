import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, message, Input, Modal, Button, Space, Alert } from 'antd'
import type { UploadProps } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { InboxOutlined, CheckOutlined, UploadOutlined, CameraOutlined } from '@ant-design/icons'
import { mediaService } from '../../services/mediaService'
import { useAuth } from '../../context/AuthContext'
import type { Image } from '../../types'

const { Dragger } = Upload

function exifFeedbackLines(img: Image): { location: string; date: string } {
  const location =
    img.gpsExtracted === true
      ? 'Location saved from photo — visible on the map.'
      : img.gpsExtracted === false
        ? 'No GPS in file — this image will not appear on the map.'
        : img.latitude != null && img.longitude != null
          ? 'Location present — visible on the map.'
          : 'No location data — not shown on the map.'

  const date =
    img.capturedFromExif === true
      ? 'Taken date/time saved from photo (EXIF).'
      : img.capturedFromExif === false
        ? 'No camera date in file — app stored upload time as the display date.'
        : img.capturedAt
          ? 'Taken date present on image.'
          : 'No taken date stored.'

  return { location, date }
}

function UploadExifSummary({ title, lines }: { title: string; lines: { location: string; date: string }[] }) {
  return (
    <div className="text-sm text-left max-w-md">
      <div className="font-medium text-[var(--text-primary)] mb-1.5">{title}</div>
      {lines.map((line, i) => (
        <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-[var(--border)]' : ''}>
          {lines.length > 1 && <div className="text-xs text-[var(--text-muted)] mb-1">Image {i + 1}</div>}
          <ul className="m-0 pl-4 list-disc space-y-0.5 text-[var(--text-secondary)]">
            <li>{line.location}</li>
            <li>{line.date}</li>
          </ul>
        </div>
      ))}
    </div>
  )
}

interface ImageUploadProps {
  projectId: string
  disabled?: boolean
  onSuccess?: () => void
}

const COMMENT_MAX = 4000

function fileToUploadFile(file: File, index: number): UploadFile {
  return {
    uid: `${Date.now()}-${index}-${file.name}`,
    name: file.name,
    status: 'done',
    originFileObj: file,
  }
}

export function ImageUpload({ projectId, disabled, onSuccess }: ImageUploadProps) {
  const { user } = useAuth()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [commentConfirmed, setCommentConfirmed] = useState(false)
  const queryClient = useQueryClient()

  const pendingFiles = useMemo(
    () => fileList.map((f) => f.originFileObj).filter((f): f is File => f instanceof File),
    [fileList]
  )

  const previewUrl = useMemo(() => {
    const first = pendingFiles[0]
    if (!first || !first.type.startsWith('image/')) return null
    return URL.createObjectURL(first)
  }, [pendingFiles])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resetModalState = () => {
    setComment('')
    setCommentConfirmed(false)
  }

  const openModalForNewFiles = (wasEmpty: boolean) => {
    if (wasEmpty || !modalOpen) {
      setModalOpen(true)
      resetModalState()
    }
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: fl }) => {
    const wasEmpty = fileList.length === 0
    setFileList(fl)
    if (fl.length > 0) {
      openModalForNewFiles(wasEmpty)
    } else {
      setModalOpen(false)
      resetModalState()
    }
  }

  const handleCameraFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files
    e.target.value = ''
    if (!picked?.length) return
    const additions = Array.from(picked).map((f, i) => fileToUploadFile(f, i))
    const wasEmpty = fileList.length === 0
    setFileList((prev) => [...prev, ...additions])
    openModalForNewFiles(wasEmpty)
  }

  const handleCancel = () => {
    setFileList([])
    setModalOpen(false)
    resetModalState()
  }

  const handleConfirmComment = () => {
    setCommentConfirmed(true)
    message.success('Comment saved — click Upload to send everything')
  }

  const handleUpload = async () => {
    if (!commentConfirmed || pendingFiles.length === 0) return
    setUploading(true)
    try {
      const uploaded: Image[] = []
      for (const file of pendingFiles) {
        const img = await mediaService.uploadImage(file, projectId, user?.name, comment.trim() || undefined)
        uploaded.push(img)
      }

      const lines = uploaded.map((img) => exifFeedbackLines(img))
      const content: ReactNode =
        pendingFiles.length === 1 ? (
          <UploadExifSummary title="Upload successful" lines={lines} />
        ) : (
          <UploadExifSummary title={`Uploaded ${pendingFiles.length} images`} lines={lines} />
        )

      message.open({ type: 'success', content, duration: pendingFiles.length === 1 ? 7 : 10 })
      setFileList([])
      setModalOpen(false)
      resetModalState()
      onSuccess?.()
      queryClient.invalidateQueries({ queryKey: ['images'] })
    } catch {
      message.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    disabled: disabled || uploading,
    fileList,
    onChange: handleChange,
    beforeUpload: () => false,
    showUploadList: false,
  }

  return (
    <>
      <Alert
        type="info"
        showIcon
        className="mb-4 text-left [&_.ant-alert-message]:text-[var(--text-primary)] [&_.ant-alert-description]:text-[var(--text-secondary)]"
        message="Get location and date on your images"
        description={
          <ul className="m-0 mt-2 pl-4 list-disc space-y-1.5 text-sm">
            <li>
              <strong className="text-[var(--text-primary)]">Turn on location for the Camera app</strong> in your phone
              or tablet settings (iOS: Settings → Privacy → Location Services → Camera. Android: Settings → Location,
              then allow the Camera app). Without this, photos usually have no GPS and will not appear on the project
              map.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Use the camera to take the picture</strong> — do not rely
              on screenshots. Screenshots often omit GPS and proper “date taken” metadata.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Check date and time</strong> on your device so the stored
              photo time matches when the image was really captured.
            </li>
            <li>
              When possible, <strong className="text-[var(--text-primary)]">upload the original file</strong> from your
              gallery or files. Some messaging apps strip location and date when you save or forward images.
            </li>
            <li>
              You can <strong className="text-[var(--text-primary)]">take a photo directly in the browser</strong> using
              “Take photo” below — on phones this opens the camera; GPS still depends on your device location settings.
            </li>
          </ul>
        }
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled || uploading}
        onChange={handleCameraFiles}
      />

      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: 'var(--color-primary)' }} />
        </p>
        <p className="ant-upload-text">Click or drag images to upload</p>
        <p className="ant-upload-hint">
          Choose from your gallery or files. Then add a comment, confirm, and upload. We read GPS and date from the
          photo file when your device saved them (EXIF).
        </p>
      </Dragger>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="default"
          icon={<CameraOutlined />}
          disabled={disabled || uploading}
          onClick={() => cameraInputRef.current?.click()}
        >
          Take photo
        </Button>
        <span className="text-sm text-[var(--text-muted)]">
          Opens your camera on phones and tablets (back camera when supported). You can also use the area above to pick
          existing photos.
        </span>
      </div>

      <Modal
        title="Comment on your upload"
        open={modalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        maskClosable={!uploading}
        closable={!uploading}
        className="[&_.ant-modal-content]:bg-[var(--surface)]"
      >
        <div className="space-y-4">
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)] flex justify-center">
              <img src={previewUrl} alt="" className="max-h-[220px] w-auto object-contain" />
            </div>
          )}
          {pendingFiles.length > 1 && (
            <p className="text-sm text-[var(--text-secondary)] m-0">
              {pendingFiles.length} images selected — the same comment will be attached to each.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Comment</label>
            <Input.TextArea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value.slice(0, COMMENT_MAX))
                setCommentConfirmed(false)
              }}
              placeholder="Type a note for this upload (optional)"
              rows={4}
              maxLength={COMMENT_MAX}
              showCount
              disabled={uploading}
              readOnly={commentConfirmed}
              className="text-[var(--text-primary)]"
              style={{ background: 'var(--surface-muted)', resize: 'vertical' as const }}
            />
            {commentConfirmed && (
              <Button type="link" size="small" className="px-0 mt-1 h-auto" onClick={() => setCommentConfirmed(false)}>
                Edit comment
              </Button>
            )}
          </div>

          <Space wrap className="w-full justify-end">
            <Button onClick={handleCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              icon={<CheckOutlined />}
              onClick={handleConfirmComment}
              disabled={uploading || commentConfirmed}
            >
              Save comment
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={!commentConfirmed}
            >
              Upload
            </Button>
          </Space>
        </div>
      </Modal>
    </>
  )
}
