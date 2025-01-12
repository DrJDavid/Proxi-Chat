'use client'

import { useState, useCallback } from 'react'
import { useDropzone, type FileWithPath } from 'react-dropzone'
import { Paperclip, X, FileIcon, ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { filesApi, FILE_TYPES } from '@/lib/api/files'
import { toast } from 'sonner'

interface FileUploadProps {
  channelId?: string
  dmId?: string
  onUploadComplete: (fileUrl: string, fileName: string) => void
}

// Use the shared file type configuration
const ACCEPTED_FILE_TYPES = Object.entries(FILE_TYPES).reduce<Record<string, string[]>>((acc, [key, value]) => {
  acc[key] = [...value.extensions] // Spread to create mutable array
  return acc
}, {})

export function FileUpload({ channelId, dmId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return
    setError(null)

    const file = acceptedFiles[0] // Handle one file at a time
    setSelectedFile(file)
    setUploading(true)
    setUploadProgress(0)

    let progressInterval: NodeJS.Timeout | undefined

    try {
      // Validate file type
      if (!Object.entries(ACCEPTED_FILE_TYPES).some(([type, extensions]) => {
        if (type === 'image/*') return file.type.startsWith('image/')
        return type === file.type
      })) {
        throw new Error('File type not supported. Please upload an image, PDF, DOC, DOCX, XLS, XLSX, or TXT file.')
      }

      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const uploadedFile = await filesApi.uploadFile(file, channelId, dmId)
      clearInterval(progressInterval)
      setUploadProgress(100)
      onUploadComplete(uploadedFile.url, uploadedFile.name)
      toast.success('File uploaded successfully')
      setSelectedFile(null)
    } catch (err: unknown) {
      if (progressInterval) clearInterval(progressInterval)
      const error = err as Error
      console.error('Error uploading file:', error)
      setError(error.message || 'Failed to upload file')
      toast.error(error.message || 'Failed to upload file')
      setSelectedFile(null)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [channelId, dmId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
  }

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : error ? 'border-destructive' : 'border-muted'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center gap-2">
            {getFileIcon(selectedFile.type)}
            <span className="text-sm">{selectedFile.name}</span>
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                  setError(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Paperclip className="h-8 w-8" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-xs">or click to select</p>
              <p className="text-xs mt-1">
                Supported: Images, PDF, TXT, DOC, DOCX, XLS, XLSX (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}

      {uploading && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-1" />
          <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  )
} 