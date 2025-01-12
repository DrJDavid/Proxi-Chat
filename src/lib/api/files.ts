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

// Define file type configuration that can be shared
export const FILE_TYPES = {
  'image/*': {
    extensions: ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  'application/pdf': {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf']
  },
  'text/plain': {
    extensions: ['.txt'],
    mimeTypes: ['text/plain']
  },
  'application/msword': {
    extensions: ['.doc'],
    mimeTypes: ['application/msword']
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  'application/vnd.ms-excel': {
    extensions: ['.xls'],
    mimeTypes: ['application/vnd.ms-excel']
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extensions: ['.xlsx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  }
} as const

export const ALLOWED_MIME_TYPES = Object.values(FILE_TYPES).flatMap(type => type.mimeTypes)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const filesApi = {
  validateFile: (file: File) => {
    // Check if file type is allowed
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      throw new Error(`File type not supported. Supported types: Images, PDF, DOC, DOCX, XLS, XLSX, TXT`)
    }
    // Check file size limit
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

      // If dmId is provided, ensure DM record exists
      if (dmId) {
        // Query for existing DM with either user combination
        const { data: existingDm, error: dmQueryError } = await supabase
          .from('direct_messages')
          .select('id')
          .eq('user1_id', session.user.id)
          .eq('user2_id', dmId)
          .maybeSingle()

        if (dmQueryError) {
          console.error('DM query error:', dmQueryError)
          throw new Error('Failed to check DM conversation')
        }

        let dmRecordId: string

        if (!existingDm) {
          // Try the reverse combination
          const { data: reverseExistingDm, error: reverseDmQueryError } = await supabase
            .from('direct_messages')
            .select('id')
            .eq('user1_id', dmId)
            .eq('user2_id', session.user.id)
            .maybeSingle()

          if (reverseDmQueryError) {
            console.error('Reverse DM query error:', reverseDmQueryError)
            throw new Error('Failed to check DM conversation')
          }

          if (!reverseExistingDm) {
            // Create new DM record
            const { data: newDm, error: dmError } = await supabase
              .from('direct_messages')
              .insert({
                user1_id: session.user.id,
                user2_id: dmId
              })
              .select('id')
              .single()

            if (dmError) {
              console.error('DM creation error:', dmError)
              throw new Error('Failed to create DM conversation')
            }

            if (!newDm) {
              throw new Error('Failed to create DM record')
            }

            dmRecordId = newDm.id
          } else {
            dmRecordId = reverseExistingDm.id
          }
        } else {
          dmRecordId = existingDm.id
        }

        // Use the actual DM record ID for the file
        dmId = dmRecordId
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `uploads/${fileName}`

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
          channel_id: channelId || null,
          dm_id: dmId || null,
          user_id: session.user.id,
        })
        .select()
        .single()

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('files')
          .remove([data.path])
        
        console.error('Database error:', dbError)
        throw new Error(dbError.message || 'Failed to save file information')
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