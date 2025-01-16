import { createClient } from '@supabase/supabase-js'
import { getEmbeddings } from '@/lib/embeddings'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { type PersonaType } from '@/types/rag'

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  throw new Error('Missing environment variables. Check NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

interface SearchResult {
  content: string
  metadata: {
    filename: string
    chunk_index: number
    total_chunks: number
  }
  similarity: number
}

interface Message {
  content: string
  created_at: string
  is_agent: boolean
  agent_persona: PersonaType | null
  user: {
    username: string | null
  } | null
  sender_id: string
}

const PERSONA_INFO: Record<PersonaType, { label: string, signature: string }> = {
  teacher: { label: 'Teacher', signature: '📚 Professor Helper' },
  student: { label: 'Student', signature: '🎓 Fellow Learner' },
  expert: { label: 'Expert', signature: '🔬 Technical Expert' },
  casual: { label: 'Casual Guide', signature: '👋 Friendly Guide' },
  mentor: { label: 'Mentor', signature: '🌟 Experienced Mentor' },
  austinite: { label: 'Matthew McConaughey', signature: '🌵 Alright, alright, alright' }
}

const PERSONA_SIGNATURES: Record<PersonaType, string> = {
  teacher: '📚 Professor Helper',
  student: '🎓 Fellow Learner',
  expert: '🔬 Technical Expert',
  casual: '👋 Friendly Guide',
  mentor: '🌟 Experienced Mentor',
  austinite: '🌵 Alright, alright, alright'
}

const PERSONA_PROMPTS: Record<PersonaType, string> = {
  teacher: 'You are a patient and knowledgeable teacher. Explain concepts clearly, use analogies when helpful, and break down complex topics into digestible pieces. Encourage learning and critical thinking.',
  student: 'You are a fellow student who has already studied this material. Share your understanding in a relatable way, acknowledge when things are complex, and focus on practical examples and study tips.',
  expert: 'You are a technical expert with deep knowledge. Provide detailed, precise information with technical depth. Don\'t shy away from complexity, but explain it thoroughly.',
  casual: 'You are a friendly, approachable guide. Keep explanations simple and conversational, use everyday analogies, and make the content engaging and accessible.',
  mentor: 'You are an experienced mentor who both teaches and guides. Balance technical accuracy with practical advice, share best practices, and help develop problem-solving skills.',
  austinite: 'You are Matthew McConaughey, the quintessential Austin local. Share your deep knowledge of Austin with that signature laid-back philosophical style. Use your characteristic phrases naturally throughout your responses:\n\n- "Alright, alright, alright"\n- "Just keep livin\'"\n- "Time is a flat circle"\n- Call people "brother" or "sister"\n- Use "L-I-V-I-N" when talking about living life\n\nDraw from your years living in Austin to give authentic perspectives on the city\'s culture, food, music, and spirit. Pepper in those philosophical tangents you\'re known for - like comparing a great taco to a perfect sunset or relating Barton Springs to the circle of life. Keep it weird and profound, just like you do. And remember - sometimes you gotta go back to actually move forward. Share your wisdom about Austin while maintaining that smooth, rhythmic McConaughey cadence in every response.'
}

async function getChannelContext(channelId: string): Promise<string> {
  // Fetch last 10 messages from the channel
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      content,
      created_at,
      is_agent,
      agent_persona,
      user:users!sender_id(username)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(10)
    .returns<Message[]>()

  if (error) {
    console.error('Error fetching channel context:', error)
    return ''
  }

  if (!messages || messages.length === 0) return ''

  // Format messages into conversation context
  return messages
    .reverse()
    .map(msg => {
      const sender = msg.is_agent && msg.agent_persona && PERSONA_INFO[msg.agent_persona] 
        ? PERSONA_INFO[msg.agent_persona].label
        : msg.user?.username || 'Unknown User'
      return `${sender}: ${msg.content}`
    })
    .join('\n')
}

export async function POST(request: Request) {
  console.log('API route handler started')
  try {
    const body = await request.json()
    console.log('Request body:', body)

    const { query, persona = 'casual' as PersonaType, channelId } = body
    if (!query) {
      console.log('No query provided')
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Validate persona type
    if (!Object.keys(PERSONA_PROMPTS).includes(persona)) {
      return NextResponse.json(
        { error: 'Invalid persona type' },
        { status: 400 }
      )
    }

    // Now TypeScript knows persona is a valid key
    const validPersona = persona as keyof typeof PERSONA_PROMPTS

    // Get channel context if available
    let channelContext = ''
    if (channelId) {
      console.log('Fetching channel context...')
      channelContext = await getChannelContext(channelId)
      console.log('Channel context length:', channelContext.length)
    }

    // First try to find relevant documents
    console.log('Generating embeddings for query:', query)
    const embedding = await getEmbeddings(query)
    console.log('Embeddings generated, length:', embedding.length)

    console.log('Searching documents with embedding...')
    const { data: documents, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        match_count: 5
      }
    )

    if (searchError) {
      console.error('Supabase search error:', searchError)
      return NextResponse.json(
        { error: `Failed to search documents: ${searchError.message}` },
        { status: 500 }
      )
    }

    console.log(`Found ${documents?.length || 0} relevant documents`)

    // Prepare context combining channel history and relevant documents
    const context = [
      channelContext && 'Recent Channel History:\n' + channelContext,
      documents && documents.length > 0 && documents[0].similarity >= 0.3
        ? documents.map((doc: SearchResult, i: number) => `Context ${i + 1}:\n${doc.content}`).join('\n')
        : ''
    ].filter(Boolean).join('\n\n')

    const prompt = context ? `Use the following context to inform your response. The context includes recent channel history and relevant documents. Incorporate the information naturally without explicitly citing sources. Stay in character and maintain your persona's style.

Context:
${context}

Question: ${query}

Remember to:
1. Use the context information naturally without explicit citations
2. Maintain your persona's unique voice and style
3. Focus on providing value rather than proving knowledge
4. Consider the ongoing conversation in the channel
5. Sign your response with: "${PERSONA_SIGNATURES[validPersona]}"` : query

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: `${PERSONA_PROMPTS[validPersona]} You have access to the channel's conversation history and relevant information that you should incorporate naturally into your responses. Don't explicitly cite sources - instead, weave the information seamlessly into your answers while maintaining your unique voice and perspective. If the context isn't relevant, draw from your general knowledge while staying in character. Sign your response with: "${PERSONA_SIGNATURES[validPersona]}"`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "text" }
      })

      const responseContent = completion.choices[0].message.content
      if (!responseContent) {
        throw new Error('No response content received from OpenAI')
      }

      console.log('Response generated successfully')
      return NextResponse.json({ 
        answer: responseContent,
        mode: context ? 'rag' : 'direct',
        similarity: documents?.[0]?.similarity || 0,
        persona
      }, { status: 200 })

    } catch (error) {
      console.error('Error generating response:', error)
      throw new Error('Failed to generate response from OpenAI')
    }
  } catch (error) {
    console.error('Error in API route:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Server error: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 