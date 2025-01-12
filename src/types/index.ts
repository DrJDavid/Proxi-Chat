export interface User {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline' | 'away'
  last_seen: string | null
}

export interface Channel {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  receiver_id: string | null
  parent_message_id: string | null
  has_attachment: boolean
  created_at: string
  user?: User
  reactions?: Reaction[]
  reply_count?: number
}

export interface Attachment {
  id: string
  message_id: string
  file_path: string
  file_type: string
}

export interface Reaction {
  id: string
  emoji: string
  user_id: string
  message_id: string
  created_at: string
  user: User
}
