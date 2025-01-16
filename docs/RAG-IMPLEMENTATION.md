# RAG Implementation Plan for ProxiChat

## 1. Document Processing Pipeline

### Input Handlers
- PDF Parser for slides and documents
- Text extractor for Zoom transcripts
- Markdown/Plain text processor
- Future extensibility for other formats (PPT, DOC, etc.)

### Document Chunking Strategy
- Chunk size: 512 tokens (adjustable based on testing)
- Overlap: 50 tokens to maintain context
- Preserve metadata:
  - Source document
  - Page number/timestamp
  - Section headers
  - Document type

## 2. Vector Storage (Supabase)

### Database Schema
```sql
-- Documents table
create table documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  type text not null, -- pdf, transcript, etc.
  metadata jsonb,
  created_at timestamptz default now()
);

-- Chunks table
create table chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  metadata jsonb, -- page_num, timestamp, headers, etc.
  embedding vector(384),
  created_at timestamptz default now()
);

-- Create vector similarity search index
create index on chunks using ivfflat (embedding vector_cosine_ops);
```

### Embedding Pipeline
- Model: all-MiniLM-L6-v2 (384 dimensions)
- Batch processing for efficiency
- Error handling and retry mechanism
- Progress tracking for large documents

## 3. Query Pipeline

### Query Processing
1. Parse user question
2. Generate question embedding
3. Semantic search in Supabase
4. Context assembly from top chunks
5. Generate response with context

### Retrieval Strategy
- Top-k retrieval (k=5 initially)
- Re-ranking based on:
  - Semantic similarity
  - Document recency
  - Chunk metadata relevance

## 4. Implementation Phases

### Phase 1: Document Ingestion (Day 1)
- [ ] Set up document processors
- [ ] Implement chunking logic
- [ ] Create database tables
- [ ] Basic document upload UI

### Phase 2: Embedding Pipeline (Day 1)
- [ ] Finalize embedding implementation
- [ ] Add batch processing
- [ ] Implement progress tracking
- [ ] Add error handling

### Phase 3: Query System (Day 2)
- [ ] Implement semantic search
- [ ] Create context assembly
- [ ] Set up response generation
- [ ] Build basic query UI

### Phase 4: Optimization (Day 2)
- [ ] Add caching layer
- [ ] Implement re-ranking
- [ ] Optimize chunk size/overlap
- [ ] Add metadata filtering

## 5. Technical Considerations

### Performance
- Batch embeddings generation
- Caching frequently accessed chunks
- Efficient vector similarity search
- Background processing for uploads

### Security
- Document access control
- API rate limiting
- Input sanitization
- Secure file storage

### Monitoring
- Embedding generation metrics
- Query performance tracking
- Error rate monitoring
- Usage analytics

## 6. Required Dependencies

```json
{
  "dependencies": {
    "@xenova/transformers": "^2.x", // Already installed
    "pdf-parse": "^1.x",           // PDF processing
    "node-html-parser": "^6.x",    // HTML/transcript processing
    "@supabase/supabase-js": "^2.x" // Already installed
  }
}
```

## 7. API Endpoints

### Document Management
```typescript
POST /api/documents/upload
POST /api/documents/process
GET /api/documents/status/:id
DELETE /api/documents/:id
```

### Query Interface
```typescript
POST /api/query
GET /api/query/history
POST /api/query/feedback
```

## 8. Testing Strategy

### Unit Tests
- Document processing
- Chunking logic
- Embedding generation
- Query processing

### Integration Tests
- Full upload pipeline
- Query pipeline
- Error handling
- Edge cases

### Performance Tests
- Large document processing
- Concurrent queries
- Vector search performance
- Response times

## 9. Future Enhancements

### Short-term
- Hybrid search (keyword + semantic)
- Document update/versioning
- Query result caching
- Feedback incorporation

### Long-term
- Multi-model support
- Real-time updates
- Advanced context assembly
- Custom embedding training 