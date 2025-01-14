import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getEmbeddings } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const openai = new OpenAI();
    
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('Generating embeddings for query:', query);
    const embedding = await getEmbeddings(query);
    
    console.log('Searching for relevant documents...');
    const { data: documents, error: searchError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        match_count: 5,
        similarity_threshold: 0.01
      }
    );

    if (searchError) {
      console.error('Error searching documents:', searchError);
      return NextResponse.json(
        { error: 'Failed to search documents' },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No relevant documents found' },
        { status: 404 }
      );
    }

    console.log(`Found ${documents.length} relevant documents`);
    
    const context = documents
      .map(doc => `${doc.content}\n\nSource: ${doc.metadata?.filename || 'Unknown'}, Chunk: ${doc.metadata?.chunk || 'N/A'}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Answer questions based on the provided context. If you cannot find the answer in the context, say so. Include relevant source information in your response.'
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${query}`
      }
    ];

    console.log('Generating answer...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages,
      temperature: 0.0,
      response_format: { type: 'text' }
    });

    const answer = completion.choices[0].message.content;
    console.log('Answer generated successfully');

    return NextResponse.json({
      answer,
      documents: documents.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity
      }))
    });
  } catch (error) {
    console.error('Error in RAG route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 