-- Enable the pgvector extension if not already enabled
create extension if not exists vector;

-- Drop the function if it exists
drop function if exists match_documents;

-- Create the match_documents function
create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold float default 0.5
)
returns table (
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  order by similarity desc
  limit match_count;
end;
$$; 