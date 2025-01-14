create or replace function match_messages (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  user_id uuid,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    m.id,
    m.content,
    m.user_id,
    m.created_at,
    1 - (me.embedding <=> query_embedding) as similarity
  from messages m
  join message_embeddings me on me.message_id = m.id
  where 1 - (me.embedding <=> query_embedding) > match_threshold
  order by me.embedding <=> query_embedding
  limit match_count;
end;
$$; 