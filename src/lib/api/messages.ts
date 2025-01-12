import supabase from '@/lib/supabase/client'
import { type Message, type Attachment, type Reaction } from '@/types'

export const messageApi = {
  // Fetch messages with pagination support
  async fetchMessages(channelId: string, options: {
    limit?: number,
    cursor?: string,
  } = {}) {
    const { limit = 50, cursor } = options
    
    let query = supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        attachments(*),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .eq('channel_id', channelId)
      .is('parent_message_id', null) // Only fetch top-level messages
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Message[]
  },

  // Send new message
  async sendMessage({ content, channelId, senderId, receiverId, parentMessageId }: {
    content: string
    channelId?: string
    senderId: string
    receiverId?: string
    parentMessageId?: string
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content,
          channel_id: channelId,
          sender_id: senderId,
          receiver_id: receiverId,
          parent_message_id: parentMessageId,
          has_attachment: false
        }
      ])
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        attachments(*),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .single()

    if (error) throw error
    return data as Message
  },

  // Get messages newer than a timestamp
  async getLatestMessages(channelId: string, after: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        attachments(*),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .eq('channel_id', channelId)
      .is('parent_message_id', null)
      .gt('created_at', after)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  },

  // Get thread messages
  async getThreadMessages(parentMessageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        attachments(*),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .eq('parent_message_id', parentMessageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  }
} 