import supabase from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface FileUpload {
  id: string
  name: string
  size: number
  type: string
  url: string
  channelId?: string
  dmId?: string
  userId: string
  createdAt: string
}

const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const filesApi = {
  validateFile: (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`File type not supported. Supported types: Images, PDF, DOC, DOCX, XLS, XLSX, TXT`)
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large (max 10MB)')
    }
  },

  uploadFile: async (file: File, channelId?: string, dmId?: string): Promise<FileUpload> => {
    try {
      // Validate file
      filesApi.validateFile(file)

      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session?.user) throw new Error('Not authenticated')

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `uploads/${fileName}` // Simplified path structure

      // Upload file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error('Failed to upload file to storage')
      }

      if (!data?.path) {
        throw new Error('No file path returned from storage')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(data.path)

      // Create file record in database
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          channel_id: channelId,
          dm_id: dmId,
          user_id: session.user.id,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error('Failed to save file information')
      }

      if (!fileRecord) {
        throw new Error('No file record returned from database')
      }

      return {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        type: fileRecord.type,
        url: fileRecord.url,
        channelId: fileRecord.channel_id,
        dmId: fileRecord.dm_id,
        userId: fileRecord.user_id,
        createdAt: fileRecord.created_at,
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      // Get file record
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()
      
      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error('Failed to fetch file information')
      }

      if (!file) {
        throw new Error('File not found')
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([`uploads/${file.name}`])
      
      if (storageError) {
        console.error('Storage delete error:', storageError)
        throw new Error('Failed to delete file from storage')
      }

      // Delete record from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
      
      if (dbError) {
        console.error('Database delete error:', dbError)
        throw new Error('Failed to delete file record')
      }
    } catch (error) {
      console.error('File deletion error:', error)
      throw error
    }
  }
} 