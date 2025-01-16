import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddings } from './embeddings';
import pdf from 'pdf-parse';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function processDocument(file: File) {
  try {
    // Read file content
    const buffer = await file.arrayBuffer();
    let text: string;

    if (file.type === 'application/pdf') {
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else {
      text = await new TextDecoder().decode(buffer);
    }

    // Split text into chunks
    const chunks = await splitter.createDocuments([text]);

    // Process each chunk
    for (const chunk of chunks) {
      const embedding = await getEmbeddings(chunk.pageContent);
      
      // Store in Supabase
      const { error } = await supabase
        .from('documents')
        .insert({
          content: chunk.pageContent,
          metadata: {
            filename: file.name,
            type: file.type,
            ...chunk.metadata
          },
          embedding
        });

      if (error) throw error;
    }

    return {
      success: true,
      chunks: chunks.length
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
} 