'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { filesApi } from '@/lib/api/files'

interface FileUploadProps {
  onUploadComplete: (filePath: string) => void
  channelId?: string
  dmId?: string
}

export function FileUpload({ onUploadComplete, channelId, dmId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setProgress(0)

    try {
      const result = await filesApi.uploadFile(file, channelId, dmId)
      onUploadComplete(result.url)
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to upload file')
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [channelId, dmId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="p-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center gap-4
          cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to select a file
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: 10MB
          </p>
        </div>
      </div>
      {uploading && (
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Uploading... {progress}%
          </p>
        </div>
      )}
    </div>
  )
} 