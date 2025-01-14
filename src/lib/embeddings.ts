import OpenAI from 'openai';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL, // Optional: only if you're using a different base URL
});

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    console.log('Generating embeddings with OpenAI...');
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    console.log('Embeddings generated successfully');
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    throw new Error('Failed to generate embeddings');
  }
} 