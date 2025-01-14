import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { channelApi } from '@/lib/api/channels'

export async function GET() {
  try {
    const channels = await channelApi.getChannels()
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    const channel = await channelApi.createChannel(name, description)
    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
