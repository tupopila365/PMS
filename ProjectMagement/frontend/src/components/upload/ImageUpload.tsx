import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { mediaService } from '../../services/mediaService'
import { useAuth } from '../../context/AuthContext'

const { Dragger } = Upload

interface ImageUploadProps {
  projectId: string
  disabled?: boolean
  onSuccess?: () => void
}

export function ImageUpload({ projectId, disabled, onSuccess }: ImageUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    disabled: disabled || uploading,
    showUploadList: false,
    customRequest: async ({ file, onSuccess: onReqSuccess, onError }: { file: unknown; onSuccess?: (body: unknown) => void; onError?: (error: Error) => void }) => {
      setUploading(true)
      try {
        await mediaService.uploadImage(file as File, projectId, user?.name)
        message.success('Upload successful')
        onReqSuccess?.(null)
        onSuccess?.()
        queryClient.invalidateQueries({ queryKey: ['images'] })
      } catch {
        message.error('Upload failed')
        onError?.(new Error('Upload failed'))
      } finally {
        setUploading(false)
      }
    },
  }

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
      </p>
      <p className="ant-upload-text">Click or drag images to upload</p>
      <p className="ant-upload-hint">Supports geo-tagged images. EXIF data will be extracted.</p>
    </Dragger>
  )
}
