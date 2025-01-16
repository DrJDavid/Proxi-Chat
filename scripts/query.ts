import { createClient } from '@supabase/supabase-js';
import { getEmbeddings } from '../src/lib/embeddings';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import readline from 'readline';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!openaiKey) {
  console.error('Missing OpenAI API key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

interface SearchResult {
  content: string;
  metadata: {
    filename: string;
    chunk_index: number;
    total_chunks: number;
  };
  similarity: number;
}

async function generateDirectResponse(query: string) {
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
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating direct response:', error);
    return null;
  }
}

async function generateRagResponse(query: string, documents: SearchResult[]) {
  const context = documents
    .map((doc, i) => {
      const source = doc.metadata?.filename || 'Unknown';
      return `[${i + 1}] From ${source}:\n${doc.content}\n`;
    })
    .join('\n');

  const prompt = `Based on the following context, answer the question. Include relevant information from the context and cite sources using their numbers [1], [2], etc.

Context:
${context}

Question: ${query}

Answer:`;

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
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating RAG response:', error);
    return null;
  }
}

async function queryDocuments(query: string) {
  try {
    console.log('\nGenerating embedding for query...');
    const embedding = await getEmbeddings(query);

    console.log('Searching for relevant documents...');
    const { data: documents, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: embedding,
        match_count: 5
      }
    );

    if (error) {
      console.error('Error searching documents:', error);
      return;
    }

    let answer: string | null;
    let mode: 'rag' | 'direct' = 'direct';

    // Check if we have relevant documents with good similarity
    if (documents && documents.length > 0 && documents[0].similarity >= 0.5) {
      console.log('\nFound relevant documents:');
      documents.forEach((doc: SearchResult, i: number) => {
        const filename = doc.metadata?.filename || 'Unknown';
        const chunkInfo = doc.metadata?.chunk_index !== undefined 
          ? `(chunk ${doc.metadata.chunk_index + 1}/${doc.metadata.total_chunks})` 
          : '';
        
        console.log(`\n--- Result ${i + 1} (${(doc.similarity * 100).toFixed(1)}% similarity) ---`);
        console.log(`Source: ${filename} ${chunkInfo}`);
        console.log('Content:', doc.content);
      });

      console.log('\nGenerating RAG response...');
      answer = await generateRagResponse(query, documents);
      mode = 'rag';
    } else {
      console.log('\nNo highly relevant documents found, using direct response...');
      answer = await generateDirectResponse(query);
    }

    if (answer) {
      console.log('\n=== Generated Answer ===');
      console.log(answer);
      console.log(`\n(Response Mode: ${mode})`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function startQueryLoop() {
  while (true) {
    const query = await new Promise<string>(resolve => {
      rl.question('\nEnter your query (or "exit" to quit): ', resolve);
    });

    if (query.toLowerCase() === 'exit') {
      rl.close();
      process.exit(0);
    }

    await queryDocuments(query);
  }
}

console.log('RAG Query Tool');
console.log('=============');
startQueryLoop(); 