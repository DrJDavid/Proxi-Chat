import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getEmbeddings } from '@/lib/embeddings';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SearchResult {
  content: string;
  similarity: number;
  metadata: {
    filename: string;
    type: string;
  };
}

export function DocumentQuery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate embedding for query
      const embedding = await getEmbeddings(query);

      // Search documents
      const { data: documents, error } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          match_count: 5
        }
      );

      if (error) throw error;
      setResults(documents);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      <div className="space-y-4">
        {results.map((result, i) => (
          <Card key={i} className="p-4">
            <p className="text-sm text-gray-500 mb-2">
              Source: {result.metadata?.filename || 'Unknown'}
              {' · '}
              Similarity: {(result.similarity * 100).toFixed(1)}%
            </p>
            <p>{result.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
} 