import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Channel } from "@/types"

export const channelApi = {
  async createChannel(name: string, description?: string): Promise<Channel> {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Not authenticated')

    // Create channel
    const { data, error } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('A channel with this name already exists')
      }
      throw error
    }

    return data
  },

  async getChannels(): Promise<Channel[]> {
    const supabase = createClientComponentClient()
    
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
    return data
  },

  async getChannelByName(name: string): Promise<Channel | null> {
    const supabase = createClientComponentClient()
    
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

    return data
  }
} 