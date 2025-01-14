-- First, drop the existing documents table
drop table if exists documents;

-- Recreate the documents table with the new vector dimension
create table documents (
  id bigint primary key generated always as identity,
  content text not null,
  metadata jsonb,
  embedding vector(1536) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
); 