// ============================================
// Markdown Preview - GitHub-style rendering
// ============================================

import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: false
});

const sanitizeMarkdown = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'type', 'disabled']
  });
};

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
  emptyMessage?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
  className = '',
  emptyMessage = 'No content to preview.'
}) => {
  const html = useMemo(() => {
    if (!markdown.trim()) return '';
    const raw = marked.parse(markdown);
    return sanitizeMarkdown(String(raw));
  }, [markdown]);

  if (!markdown.trim()) {
    return (
      <div className={`markdown-body markdown-preview ${className}`.trim()}>
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`markdown-body markdown-preview ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
