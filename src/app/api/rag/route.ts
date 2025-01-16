import { createClient } from '@supabase/supabase-js'
import { getEmbeddings } from '@/lib/embeddings'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

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

async function generateDirectResponse(query: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that can engage in general conversation while also having access to specific document knowledge when needed. Be concise, clear, and helpful in your responses.'
        },
        {
          role: 'user',
          content: query
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
    return responseContent
  } catch (error) {
    console.error('Error generating direct response:', error)
    throw new Error('Failed to generate response from OpenAI')
  }
}

async function generateRagResponse(query: string, documents: SearchResult[]): Promise<string> {
  const context = documents
    .map((doc, i) => {
      const source = doc.metadata?.filename || 'Unknown'
      return `[${i + 1}] From ${source}:\n${doc.content}\n`
    })
    .join('\n')

  const prompt = `Based on the following context, answer the question. Include relevant information from the context and cite sources using their numbers [1], [2], etc.

Context:
${context}

Question: ${query}

Answer:`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on the provided context. Always cite your sources using the provided numbers, and be concise but thorough. If the context is not relevant to the question, say so and provide a general response instead.'
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
    return responseContent
  } catch (error) {
    console.error('Error generating RAG response:', error)
    throw new Error('Failed to generate answer from OpenAI')
  }
}

export async function POST(request: Request) {
  console.log('API route handler started')
  try {
    const body = await request.json()
    console.log('Request body:', body)

    const { query } = body
    if (!query) {
      console.log('No query provided')
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
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

    let answer: string
    let mode: 'rag' | 'direct' = 'direct'

    // Check if we have relevant documents with good similarity
    if (documents && documents.length > 0 && documents[0].similarity >= 0.5) {
      // Use RAG with the relevant documents
      console.log('Using RAG response with relevant documents')
      answer = await generateRagResponse(query, documents)
      mode = 'rag'
    } else {
      // Use direct response for general queries or when no relevant docs found
      console.log('Using direct response for query')
      answer = await generateDirectResponse(query)
    }

    console.log('Response generated successfully')
    return NextResponse.json({ 
      answer,
      mode,
      similarity: documents?.[0]?.similarity || 0
    }, { status: 200 })

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