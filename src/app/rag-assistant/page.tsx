import { DocumentQuery } from '@/components/document-query';

export default function RAGAssistant() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">RAG Assistant</h1>
      <DocumentQuery />
    </div>
  );
} 