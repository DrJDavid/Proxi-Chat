import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { messageApi } from '@/lib/api/messages'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getEmbeddings } from '@/lib/embeddings'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const channelId = searchParams.get('channelId')
  const limit = searchParams.get('limit')

  if (!channelId) {
    return NextResponse.json(
      { error: 'Channel ID is required' },
      { status: 400 }
    )
  }

  try {
    const messages = await messageApi.fetchMessages(channelId, {
      limit: limit ? parseInt(limit) : 50
    })
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { content, channelId } = await req.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Start a transaction
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        content,
        channel_id: channelId,
        user_id: user.id,
      })
      .select()
      .single()

    if (messageError || !message) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Generate and store embedding
    const embedding = await getEmbeddings(content)
    const { error: embeddingError } = await supabase
      .from('message_embeddings')
      .insert({
        message_id: message.id,
        embedding
      })

    if (embeddingError) {
      console.error('Error storing embedding:', embeddingError)
      // Don't fail the request if embedding fails
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error in messages route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
