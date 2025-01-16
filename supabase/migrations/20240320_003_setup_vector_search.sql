-- Enable the pgvector extension
create extension if not exists vector;

-- Drop existing table if it exists
drop table if exists documents;

-- Create the documents table
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create the match_documents function
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding is not null
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$; 