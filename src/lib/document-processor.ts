import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddings } from './embeddings';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function processDocument(buffer: Buffer, filename: string, type: string) {
  try {
    // Extract text based on file type
    let text: string;
    
    try {
      if (type === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else if (type === 'text/plain') {
        text = buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${type}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract text from document');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in document');
    }

    // Split text into chunks
    const chunks = await splitter.createDocuments([text]);

    if (chunks.length === 0) {
      throw new Error('No valid chunks created from document');
    }

    // Process each chunk
    const results = [];
    for (const chunk of chunks) {
      try {
        const embedding = await getEmbeddings(chunk.pageContent);
        
        // Store in Supabase
        const { data, error } = await supabase
          .from('documents')
          .insert({
            content: chunk.pageContent,
            metadata: {
              filename,
              type,
              chunk_index: chunks.indexOf(chunk),
              total_chunks: chunks.length,
              ...chunk.metadata
            },
            embedding
          })
          .select('id')
          .single();

        if (error) throw error;
        results.push(data.id);
      } catch (error) {
        console.error('Error processing chunk:', error);
        throw new Error('Failed to process document chunk');
      }
    }

    return {
      success: true,
      chunks: chunks.length,
      filename,
      type,
      documentIds: results
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error instanceof Error ? error : new Error('Failed to process document');
  }
} 