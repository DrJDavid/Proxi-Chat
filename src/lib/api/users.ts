import { AuthError } from '@supabase/supabase-js'
import supabase from '@/lib/supabase/client'
import { type User } from '@/types'

interface PostgrestError {
  message: string
  code: string
  details?: string
  hint?: string
}

export const userApi = {
  async fetchUsers() {
    try {
      console.log('Fetching users...')
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at, updated_at, status, last_seen')
        .order('username')

      if (error) {
        console.error('Supabase error details:', error as PostgrestError)
        throw error
      }

      if (!data) {
        console.error('No data returned from users query')
        throw new Error('No data returned from users query')
      }

      console.log('Raw user data:', data)
      const transformedUsers = data.map(user => {
        // Check if user has been inactive for more than 2 minutes
        const lastSeen = user.last_seen ? new Date(user.last_seen) : null
        const isInactive = !lastSeen || (new Date().getTime() - lastSeen.getTime()) > 2 * 60 * 1000

        return {
          ...user,
          // Override status to offline if user is inactive
          status: isInactive ? 'offline' : (user.status || 'offline')
        }
      })
      console.log('Transformed users:', transformedUsers)
      return transformedUsers as User[]
    } catch (err) {
      const error = err as Error
      console.error('Error in fetchUsers:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away') {
    try {
      console.log('Updating status:', { userId, status })
      const { error } = await supabase
        .from('users')
        .update({ 
          status,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Supabase error in updateStatus:', error as PostgrestError)
        throw error
      }
    } catch (err) {
      const error = err as Error
      console.error('Error in updateStatus:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  async getCurrentUser() {
    try {
      console.log('Getting current user...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', {
          message: sessionError.message,
          code: (sessionError as AuthError).code
        })
        throw sessionError
      }

      if (!session?.user) {
        console.log('No active session')
        return null
      }

      console.log('Session user:', session.user)
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at, updated_at, status, last_seen')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Supabase error in getCurrentUser:', error as PostgrestError)
        throw error
      }

      if (!data) {
        console.error('No user data found for id:', session.user.id)
        throw new Error('User data not found')
      }

      console.log('Current user data:', data)
      return {
        ...data,
        status: data.status || 'offline'
      } as User
    } catch (err) {
      const error = err as Error
      console.error('Error in getCurrentUser:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      throw error
    }
  }
} 