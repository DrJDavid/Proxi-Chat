import supabase from '@/lib/supabase/client'
import { type Channel } from '@/types'

export const channelApi = {
  async getChannels() {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        )
      `)
      .order('name')

    if (error) throw error
    return data as Channel[]
  },

  async getChannelByName(name: string) {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        )
      `)
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data as Channel
  },

  async createChannel(name: string, description?: string) {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        created_by: session.user.id
      })
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('A channel with this name already exists')
      }
      throw error
    }

    return data as Channel
  }
} 