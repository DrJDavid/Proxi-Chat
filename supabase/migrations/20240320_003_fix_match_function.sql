-- Drop the existing function
drop function if exists match_documents;

-- Drop existing table
drop table if exists documents;

-- Create the documents table with correct vector dimensions
create table if not exists documents (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    metadata jsonb not null default '{}'::jsonb,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the similarity search function
create or replace function match_documents (
    query_embedding vector(1536),
    match_count int default 5,
    similarity_threshold float default 0.3
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
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from documents
    where embedding is not null
    and 1 - (embedding <=> query_embedding) >= similarity_threshold
    order by similarity desc
    limit match_count;
end;
$$; 