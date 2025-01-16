import { DocumentUpload } from '@/components/document-upload';
import { DocumentQuery } from '@/components/document-query';

export default function RAGPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Document Management</h1>
        <DocumentUpload />
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Search Documents</h2>
        <DocumentQuery />
      </div>
    </div>
  );
} 