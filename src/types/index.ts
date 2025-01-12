export interface User {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline'
  last_seen: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
}

export interface Message {
  id: string
  content: string
  channel_id: string | null
  sender_id: string
  receiver_id: string | null
  created_at: string
  has_attachment: boolean
  parent_message_id: string | null
  user?: User
  attachments?: Attachment[]
  reactions?: Reaction[]
  optimistic?: boolean
}

export interface Attachment {
  id: string
  message_id: string
  file_path: string
  file_type: string
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: User
}
