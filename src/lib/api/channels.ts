import supabase from '@/lib/supabase/client'
import { type Channel, type ChannelMember } from '@/types'

interface RawChannelData {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  creator: {
    id: string
    username: string
    avatar_url: string | null
  }
  member_count: Array<{ count: number }>
}

async function checkSession() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('Session error:', sessionError)
    throw new Error('Authentication failed: ' + sessionError.message)
  }
  if (!session?.user) {
    console.error('No session found')
    throw new Error('Not authenticated')
  }
  return session.user
}

export const channelApi = {
  async getChannels() {
    console.log('Starting getChannels...')
    const user = await checkSession()
    console.log('User authenticated:', user.id)

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
      throw new Error('Failed to fetch channels: ' + error.message)
    }
    
    console.log('Raw channel data:', data)
    
    if (!data || data.length === 0) {
      console.log('No channels found in database')
      return []
    }
    
    // Transform the count from { count: number } to just number
    const transformedChannels = (data as RawChannelData[]).map(channel => ({
      ...channel,
      member_count: channel.member_count[0]?.count || 0
    }))
    
    console.log('Transformed channels:', transformedChannels)
    return transformedChannels as Channel[]
  },

  async getChannelById(id: string) {
    console.log('Getting channel by ID:', id)
    await checkSession()

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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching channel by ID:', error)
      if (error.code === 'PGRST116') {
        console.log('Channel not found')
        return null
      }
      throw new Error('Failed to fetch channel: ' + error.message)
    }

    if (!data) {
      console.log('No data returned for channel')
      return null
    }

    console.log('Found channel:', data)
    return {
      ...data,
      member_count: data.member_count[0]?.count || 0
    } as Channel
  },

  async getChannelByName(name: string) {
    console.log('Getting channel by name:', name)
    await checkSession()

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
      console.error('Error fetching channel by name:', error)
      if (error.code === 'PGRST116') {
        console.log('Channel not found')
        return null
      }
      throw new Error('Failed to fetch channel: ' + error.message)
    }

    if (!data) {
      console.log('No data returned for channel')
      return null
    }

    console.log('Found channel:', data)
    return {
      ...data,
      member_count: data.member_count[0]?.count || 0
    } as Channel
  },

  async isChannelMember(channelId: string) {
    console.log('Checking channel membership for channel:', channelId)
    const user = await checkSession()

    try {
      const { count, error } = await supabase
        .from('channel_members')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error checking channel membership:', error)
        throw new Error('Failed to check channel membership: ' + error.message)
      }

      const isMember = count !== null && count > 0
      console.log('Membership check result:', { channelId, userId: user.id, isMember })
      return isMember
    } catch (error) {
      console.error('Error in isChannelMember:', error)
      throw error
    }
  },

  async createChannel(name: string, description?: string) {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session?.user) throw new Error('Not authenticated')

    // Start a transaction
    const { data: channel, error: channelError } = await supabase
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

    if (channelError) {
      if (channelError.code === '23505') { // Unique violation
        throw new Error('A channel with this name already exists')
      }
      throw channelError
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: session.user.id
      })

    if (memberError) {
      // If adding member fails, delete the channel
      await supabase
        .from('channels')
        .delete()
        .eq('id', channel.id)
      throw memberError
    }

    return {
      ...channel,
      member_count: 1 // Creator is the first member
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

    // First get all message IDs in this channel
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('channel_id', channelId)

    if (messages && messages.length > 0) {
      const messageIds = messages.map(m => m.id)
      
      // Delete all reactions to messages in this channel
      const { error: reactionsError } = await supabase
        .from('reactions')
        .delete()
        .in('message_id', messageIds)

      if (reactionsError) throw reactionsError
    }

    // Delete all messages in the channel
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('channel_id', channelId)

    if (messagesError) throw messagesError

    // Delete all channel members
    const { error: membersError } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)

    if (membersError) throw membersError

    // Finally delete the channel
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

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

    return (data as RawChannelData[]).map(channel => ({
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