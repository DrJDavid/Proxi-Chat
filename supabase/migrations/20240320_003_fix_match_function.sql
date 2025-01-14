-- Drop the existing function
drop function if exists match_documents;

-- Create the fixed version
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5
) returns table (
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
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding is not null
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$; 