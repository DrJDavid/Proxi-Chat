"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { processDocument } from '@/lib/document-processor';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export function DocumentUpload() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    setProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        await processDocument(file);
        setProgress(((i + 1) / acceptedFiles.length) * 100);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    }
  });

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {processing ? (
          <div className="space-y-4">
            <p>Processing documents...</p>
            <Progress value={progress} />
          </div>
        ) : (
          <div>
            <p>Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-500 mt-2">
              Supports PDF, TXT, and MD files
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 