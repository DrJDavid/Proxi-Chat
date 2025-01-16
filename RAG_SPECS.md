# RAG Technical Specifications

## Architecture Overview

### Document Processing Pipeline
- **File Support**: PDF files (primary)
- **Text Extraction**: PDFLoader from LangChain
- **Chunking Strategy**:
  - Chunk Size: 500 characters
  - Overlap: 100 characters
  - Separators: ['\n\n', '\n', '. ', '! ', '? ', ';', ':', ' ', '']

### Vector Database
- **Platform**: Supabase with pgvector extension
- **Table Structure**:
  ```sql
  create table documents (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    metadata jsonb default '{}'::jsonb,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  ```
- **Metadata Schema**:
  ```typescript
  interface Metadata {
    filename?: string;
    chunk?: number;
    [key: string]: any;
  }
  ```

### Embeddings
- **Model**: OpenAI text-embedding-3-small
- **Dimensions**: 1536
- **Configuration**:
  ```typescript
  {
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float"
  }
  ```

### Vector Search
- **Implementation**: Cosine similarity via pgvector
- **Parameters**:
  - Match Count: 5 documents
  - Similarity Threshold: 0.01
- **Query Function**:
  ```sql
  create or replace function match_documents (
    query_embedding vector(1536),
    match_count int default 5,
    similarity_threshold float default 0.01
  ) returns table (
    content text,
    metadata jsonb,
    similarity float
  )
  ```

### Answer Generation
- **Model**: GPT-4-0125-preview (GPT-4 Turbo)
- **Configuration**:
  ```typescript
  {
    model: 'gpt-4-0125-preview',
    temperature: 0.0,
    response_format: { type: 'text' }
  }
  ```
- **Context Format**:
  ```
  ${content}\n\nSource: ${metadata?.filename || 'Unknown'}, Chunk: ${metadata?.chunk || 'N/A'}
  ```

## API Endpoints

### Document Upload
```typescript
POST /api/documents
Content-Type: multipart/form-data

Response: {
  success: boolean;
  chunks: number;
}
```

### Query
```typescript
POST /api/rag
Content-Type: application/json
Body: {
  query: string;
}

Response: {
  answer: string;
  documents: Array<{
    content: string;
    metadata: Metadata;
    similarity: number;
  }>;
}
```

## Environment Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-key>
OPENAI_API_KEY=<openai-api-key>
```

## Dependencies
- **Vector Database**: @supabase/supabase-js
- **PDF Processing**: langchain/document_loaders/fs/pdf
- **Text Processing**: langchain/text_splitter
- **Embeddings & LLM**: openai
- **Framework**: Next.js 14 (App Router)

## Performance Characteristics
- **Chunk Processing**: Sequential
- **Vector Search**: ~100-200ms average response time
- **Answer Generation**: ~2-3s average response time
- **Document Size Limits**: 
  - Individual Files: 10MB
  - Total Upload: 50MB

## Error Handling
- **Document Processing**:
  - Invalid file type validation
  - File size limits
  - PDF parsing errors
- **Vector Operations**:
  - Embedding generation failures
  - Database connection issues
  - Query timeout (60s)
- **Answer Generation**:
  - Context length limits
  - API rate limits
  - Model errors

## Security Measures
- **Authentication**: Supabase Auth
- **API Protection**: 
  - Rate limiting (pending)
  - Request validation
  - Error sanitization
- **Data Access**: 
  - Service role for admin operations
  - Anon key for public queries 