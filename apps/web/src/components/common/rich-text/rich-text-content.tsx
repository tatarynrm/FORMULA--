import { cn } from '@/lib/utils';

interface RichTextContentProps {
  /** HTML that the api already sanitized when it was saved. */
  html: string;
  className?: string;
}

/**
 * Shows rich text from the editor. The html comes from the api, which strips everything except
 * formatting before it stores it, so rendering it as html is safe. Never pass user input that has
 * not gone through the api here.
 */
export function RichTextContent({ html, className }: RichTextContentProps) {
  return <div className={cn('rich-text', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
