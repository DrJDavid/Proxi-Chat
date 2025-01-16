import React from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface MessageContentProps {
  content: string
}

export function MessageContent({ content }: MessageContentProps) {
  if (content.startsWith('[File shared]')) {
    const fileUrl = content.match(/\((.*?)\)/)?.[1]
    return (
      <a 
        href={fileUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        View shared file
      </a>
    )
  }

  // Check if content is already HTML
  const isHTML = /<[a-z][\s\S]*>/i.test(content)

  // If it's not HTML, convert markdown-style formatting
  const processedContent = isHTML ? content : content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/^- (.*?)$/gm, '• $1')

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: ['strong', 'em', 'u', 's', 'strike', 'div', 'span', 'p', 'br', 'b', 'i'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }

  // Sanitize the content
  const sanitizedContent = DOMPurify.sanitize(processedContent, config)

  return (
    <p 
      className="text-sm whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
} 