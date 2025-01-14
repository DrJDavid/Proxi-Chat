import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getEmbeddings } from '../src/lib/embeddings';
import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import pdf from 'pdf-parse';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  console.error('Required variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Adjust chunk size and overlap for better context
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,      // Smaller chunks for more granular retrieval
  chunkOverlap: 100,   // Good overlap to maintain context
  separators: ['\n\n', '\n', ' ', ''] // Custom separators to better handle PDF structure
});

function cleanText(text: string): string {
  return text
    .replace(/\u0000/g, '') // Remove null characters
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove replacement characters
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Replace non-ASCII with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\\u[\dA-F]{4}/gi, '') // Remove Unicode escape sequences
    .replace(/[|]\s+/g, ' ') // Remove PDF artifacts
    .trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const options = {
    // Preserve as much information as possible
    preserveFormFeedChar: true,
    normalizeWhitespace: false,
    disableCombineTextItems: false,
    pagerender: function(pageData: any) {
      const textContent = pageData.getTextContent();
      return textContent.then(function(content: any) {
        let lastY, text = '';
        const items = content.items;
        
        // Sort items by their vertical position to maintain reading order
        items.sort((a: any, b: any) => b.transform[5] - a.transform[5]);
        
        for (const item of items) {
          const y = item.transform[5];
          const str = item.str;
          
          if (lastY !== y) {
            // New line
            text += '\n';
          } else {
            // Same line, add appropriate spacing
            const spaceWidth = Math.ceil(item.width / 5); // Approximate space width
            text += ' '.repeat(spaceWidth);
          }
          
          text += str;
          lastY = y;
        }
        return text;
      });
    }
  };

  try {
    const data = await pdf(buffer, options);
    // Join all pages with clear separation
    const fullText = data.text;
    return cleanText(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

async function processFile(filePath: string) {
  try {
    const fileContent = await readFile(filePath);
    const fileExt = extname(filePath).toLowerCase();
    let text: string;

    console.log(`\nProcessing ${filePath}`);

    // Extract text based on file type
    if (fileExt === '.pdf') {
      text = await extractPdfText(fileContent);
      console.log(`Extracted ${text.length} characters from PDF`);
    } else if (['.txt', '.md'].includes(fileExt)) {
      text = cleanText(fileContent.toString());
    } else {
      console.warn(`Skipping unsupported file type: ${filePath}`);
      return;
    }

    if (!text || text.length < 10) {
      console.warn(`Warning: Extracted text is too short or empty for ${filePath}`);
      return;
    }

    // Split text into chunks
    const chunks = await splitter.createDocuments([text]);
    console.log(`Generated ${chunks.length} chunks from ${text.length} characters`);

    // Process each chunk
    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        // Skip chunks that are too short
        if (chunk.pageContent.length < 50) {
          console.log(`Skipping chunk ${i} (too short: ${chunk.pageContent.length} chars)`);
          continue;
        }

        const embedding = await getEmbeddings(chunk.pageContent);
        
        const { error } = await supabase
          .from('documents')
          .insert({
            content: cleanText(chunk.pageContent),
            metadata: {
              filename: filePath,
              chunk_index: i,
              total_chunks: chunks.length,
              char_length: chunk.pageContent.length,
              ...chunk.metadata
            },
            embedding
          });

        if (error) {
          console.error(`Error storing chunk ${i}:`, error);
          continue;
        }
        successCount++;
        process.stdout.write('.');
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
      }
    }
    console.log(`\n✅ File processed successfully (${successCount}/${chunks.length} chunks stored)`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dirPath: string) {
  try {
    const files = await readdir(dirPath);
    console.log(`Found ${files.length} files in ${dirPath}`);

    for (const file of files) {
      const filePath = join(dirPath, file);
      await processFile(filePath);
    }
    console.log('\nProcessing complete!');
  } catch (error) {
    console.error('Error processing directory:', error);
    process.exit(1);
  }
}

// Get directory path from command line argument
const dirPath = process.argv[2];
if (!dirPath) {
  console.error('Please provide a directory path: npm run upload-docs <path>');
  process.exit(1);
}

processDirectory(dirPath); 