import { Pipeline, pipeline } from '@xenova/transformers';

type EmbeddingPipeline = Awaited<ReturnType<typeof pipeline>>;
let embeddingPipeline: EmbeddingPipeline | null = null;

interface EmbeddingOutput {
  data: Float32Array;
}

export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    if (!embeddingPipeline) {
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      ) as EmbeddingPipeline;
    }

    if (!embeddingPipeline) {
      throw new Error('Failed to initialize embedding pipeline');
    }

    const result = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: false
    }) as EmbeddingOutput;

    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
} 