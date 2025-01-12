import supabase from '@/lib/supabase/client'
import { type Channel, type ChannelMember } from '@/types'

export const channelApi = {
  async getChannels() {
    console.log('Starting getChannels...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }
    if (!session?.user) {
      console.error('No session found')
      throw new Error('Not authenticated')
    }
    console.log('User authenticated:', session.user.id)

    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        ),
        member_count:channel_members(count)
      `)
      .order('name')

    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    console.log('Raw channel data:', data)
    
    if (!data || data.length === 0) {
      console.log('No channels found in database')
    }
    
    // Transform the count from { count: number } to just number
    const transformedChannels = (data as any[]).map(channel => ({
      ...channel,
      member_count: channel.member_count[0]?.count || 0
    }))
    
    console.log('Transformed channels:', transformedChannels)
    return transformedChannels as Channel[]
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
        ),
        member_count:channel_members(count)
      `)
      .eq('name', name)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return {
      ...data,
      member_count: data.member_count[0]?.count || 0
    } as Channel
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
        ),
        member_count:channel_members(count)
      `)
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('A channel with this name already exists')
      }
      throw error
    }

    return {
      ...data,
      member_count: data.member_count[0]?.count || 0
    } as Channel
  },

  async deleteChannel(channelId: string) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    // Check if user is the creator
    const { data: channel } = await supabase
      .from('channels')
      .select('created_by')
      .eq('id', channelId)
      .single()

    if (channel?.created_by !== session.user.id) {
      throw new Error('Only the channel creator can delete this channel')
    }

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)
      .eq('created_by', session.user.id)

    if (error) throw error
  },

  async getChannelMembers(channelId: string) {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        user:users(
          id,
          username,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)

    if (error) throw error
    return data as ChannelMember[]
  },

  async getUserChannels() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    // First get the channel IDs the user is a member of
    const { data: memberChannels, error: memberError } = await supabase
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', session.user.id)

    if (memberError) throw memberError
    const channelIds = memberChannels.map(row => row.channel_id)

    // If user isn't a member of any channels, return empty array
    if (channelIds.length === 0) return []

    // Then get the full channel data for those channels
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        ),
        member_count:channel_members(count)
      `)
      .in('id', channelIds)
      .order('name')

    if (error) throw error

    return (data as any[]).map(channel => ({
      ...channel,
      member_count: channel.member_count[0]?.count || 0
    })) as Channel[]
  },

  async joinChannel(channelId: string) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: session.user.id
      })

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('You are already a member of this channel')
      }
      throw error
    }
  },

  async leaveChannel(channelId: string) {
    console.log('Attempting to leave channel:', channelId)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }
    if (!session?.user) {
      console.error('No session found')
      throw new Error('Not authenticated')
    }
    console.log('User authenticated:', session.user.id)

    // Check if user is the creator of the channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('created_by')
      .eq('id', channelId)
      .single()

    if (channelError) {
      console.error('Error checking channel creator:', channelError)
      throw channelError
    }

    console.log('Channel creator check:', {
      channelId,
      creatorId: channel?.created_by,
      userId: session.user.id,
      isCreator: channel?.created_by === session.user.id
    })

    if (channel?.created_by === session.user.id) {
      throw new Error('Channel creators cannot leave their own channels. Delete the channel instead.')
    }

    // Delete the channel membership
    const { error: deleteError } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Error deleting channel membership:', deleteError)
      throw deleteError
    }

    console.log('Successfully left channel:', channelId)
  },

  async isChannelMember(channelId: string) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('channel_members')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false // Not found
      throw error
    }

    return true
  },

  async editChannel(channelId: string, updates: { name?: string; description?: string }) {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    // Check if user is the creator
    const { data: channel } = await supabase
      .from('channels')
      .select('created_by')
      .eq('id', channelId)
      .single()

    if (!channel) {
      throw new Error('Channel not found')
    }

    if (channel.created_by !== session.user.id) {
      throw new Error('Only the channel creator can edit this channel')
    }

    // If updating name, check if it already exists
    if (updates.name) {
      const { data: existingChannel } = await supabase
        .from('channels')
        .select('id')
        .eq('name', updates.name)
        .neq('id', channelId)
        .single()

      if (existingChannel) {
        throw new Error('A channel with this name already exists')
      }
    }

    // First do the update
    const { error: updateError } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channelId)

    if (updateError) throw updateError

    // Then fetch the updated channel
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        creator:users!created_by(
          id,
          username,
          avatar_url
        ),
        member_count:channel_members(count)
      `)
      .eq('id', channelId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to fetch updated channel')

    return {
      ...data,
      member_count: data.member_count[0]?.count || 0
    } as Channel
  }
} 