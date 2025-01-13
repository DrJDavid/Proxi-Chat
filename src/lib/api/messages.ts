import supabase from '@/lib/supabase/client'
import { type Message, type Reaction } from '@/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const messageApi = {
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
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .eq('channel_id', channelId)
      .is('parent_message_id', null) // Only fetch top-level messages
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: messages, error } = await query
    if (error) throw error

    // Fetch reply counts for each message
    if (messages && messages.length > 0) {
      const replyCounts = await Promise.all(
        messages.map(async (message) => {
          const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('parent_message_id', message.id)

          if (error) throw error
          return { messageId: message.id, count }
        })
      )

      // Add reply counts to messages
      const messagesWithReplyCounts = messages.map(message => ({
        ...message,
        reply_count: replyCounts.find(rc => rc.messageId === message.id)?.count || 0
      }))

      return messagesWithReplyCounts as Message[]
    }

    return messages as Message[]
  },

  async fetchDirectMessages(senderId: string, receiverId: string, options: {
    limit?: number,
    cursor?: string,
  } = {}) {
    const { limit = 50, cursor } = options
    
    let query = supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .is('channel_id', null)
      .is('parent_message_id', null)
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: messages, error } = await query
    if (error) throw error

    // Fetch reply counts for each message
    if (messages && messages.length > 0) {
      const replyCounts = await Promise.all(
        messages.map(async (message) => {
          const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('parent_message_id', message.id)

          if (error) throw error
          return { messageId: message.id, count }
        })
      )

      // Add reply counts to messages
      const messagesWithReplyCounts = messages.map(message => ({
        ...message,
        reply_count: replyCounts.find(rc => rc.messageId === message.id)?.count || 0
      }))

      return messagesWithReplyCounts as Message[]
    }

    return messages as Message[]
  },

  async sendMessage({ content, channelId, senderId, receiverId, parentMessageId }: {
    content: string
    channelId?: string
    senderId: string
    receiverId?: string
    parentMessageId?: string
  }) {
    const now = new Date().toISOString()
    const messageData = {
      content,
      channel_id: channelId,
      sender_id: senderId,
      receiver_id: receiverId,
      parent_message_id: parentMessageId,
      has_attachment: false,
      created_at: now
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        user:users!sender_id(id, username, full_name, avatar_url, status),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(id, username, avatar_url)
        )
      `)
      .single()

    if (error) {
      console.error('Error details:', error)
      throw error
    }
    return { ...data, reply_count: 0 } as Message
  },

  async addReaction({ messageId, userId, emoji }: {
    messageId: string
    userId: string
    emoji: string
  }) {
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single()

    if (existingReaction) {
      // Remove reaction if it already exists
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (error) throw error
      return
    }

    // Add new reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji
      })
      .select(`
        *,
        user:users!user_id(
          id,
          username,
          full_name,
          avatar_url,
          status
        )
      `)
      .single()

    if (error) throw error
    return data as Reaction
  },

  async getThreadMessages(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users!sender_id(
          id,
          username,
          full_name,
          avatar_url,
          status
        ),
        reactions(
          id,
          emoji,
          created_at,
          user:users!user_id(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('parent_message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  },

  async fetchRecentDirectMessageUsers(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .is('channel_id', null)
      .is('parent_message_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data
  },

  async deleteMessage(messageId: string) {
    try {
      // First delete all replies to this message
      const { error: repliesError } = await supabase
        .from('messages')
        .delete()
        .eq('parent_message_id', messageId)

      if (repliesError) {
        console.error('Error deleting replies:', repliesError)
        throw new Error('Failed to delete message replies')
      }

      // Then delete the message itself
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .single()

      if (messageError) {
        console.error('Error deleting message:', messageError)
        throw new Error('Failed to delete message')
      }

      return true
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      throw error
    }
  },

  async editMessage(messageId: string, content: string) {
    try {
      console.log('Starting editMessage API call:', { messageId, content })
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      if (!session?.user) {
        throw new Error('Not authenticated')
      }

      // Check if user is the sender
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (messageError) {
        console.error('Error fetching message:', messageError)
        throw messageError
      }

      if (!message) {
        throw new Error('Message not found')
      }

      if (message.sender_id !== session.user.id) {
        throw new Error('Only the message sender can edit this message')
      }

      // Update the message
      const { data: updatedMessage, error: updateError } = await supabase
        .from('messages')
        .update({ 
          content,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', session.user.id)
        .select(`
          id,
          content,
          created_at,
          edited_at,
          sender_id,
          channel_id,
          parent_message_id,
          has_attachment,
          user:users!sender_id(id, username, full_name, avatar_url, status),
          reactions(
            id,
            emoji,
            created_at,
            user:users!user_id(id, username, avatar_url)
          )
        `)
        .single()

      if (updateError) {
        console.error('Error updating message:', updateError)
        throw updateError
      }

      if (!updatedMessage) {
        throw new Error('Failed to update message')
      }
      console.log('Message updated successfully:', updatedMessage)
      // Cast to unknown first to handle type mismatch between DB and Message type
      return { 
        ...updatedMessage, 
        reply_count: 0,
        user: updatedMessage.user[0] // Convert user array to single user object
      } as unknown as Message
    } catch (error) {
      console.error('Error in editMessage:', error)
      throw error
    }
  }
} 