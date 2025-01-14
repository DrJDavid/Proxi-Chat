import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { messageApi } from '@/lib/api/messages'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, channelId, senderId } = body

    if (!content || !channelId || !senderId) {
      return NextResponse.json(
        { error: 'Content, channelId, and senderId are required' },
        { status: 400 }
      )
    }

    const message = await messageApi.sendMessage({
      content,
      channelId,
      senderId
    })
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
