// ============================================
// Unified Markdown Preview - README-style rendering
// ============================================

import React, { useState } from 'react';
import { CodeEditor, TemplateManager, MarkdownPreview } from '../../components/common';
import { Button } from '../../components/Button';
import { FileText, Copy, Check, Download, Columns, Maximize2 } from 'lucide-react';

const defaultMarkdown = `# DataToolkit

A professional toolkit for **XML**, **JSON**, and **Markdown**.

## Features

- Format, validate, and minify structured data
- Sort and compare with visual diffs
- Convert between XML, JSON, and Markdown
- Visualize trees and generate tables

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Example Table

| Name | Type | Description |
| :--- | :---: | ---: |
| id | number | Unique identifier |
| name | string | Display name |
| active | boolean | Enabled flag |

## Tasks

- [x] Setup project
- [x] Add markdown preview
- [ ] Polish UI

> Tip: paste a README.md here to preview it like GitHub.
`;

export const UnifiedMarkdownPreview: React.FC = () => {
  const [input, setInput] = useState<string>(defaultMarkdown);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('split');

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadTemplate = (content: string) => {
    setInput(content);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Markdown Preview
          </h2>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                viewMode === 'split'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split view"
            >
              <Columns size={14} className="inline mr-1" />
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                viewMode === 'preview'
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full preview"
            >
              <Maximize2 size={14} className="inline mr-1" />
              Full Preview
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleCopy}
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="secondary" onClick={handleDownload} icon={<Download size={16} />}>
            Download
          </Button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Input */}
          <div className="flex flex-col gap-2 h-full">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-400">Markdown</label>
              <TemplateManager
                currentContent={input}
                currentFormat="markdown"
                onLoad={handleLoadTemplate}
                compact
              />
            </div>
            <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
              <CodeEditor
                value={input}
                onChange={setInput}
                format="markdown"
                showLineNumbers
                placeholder="Paste your README.md here..."
              />
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            <label className="text-sm font-medium text-slate-400">Preview</label>
            <MarkdownPreview
              markdown={input}
              className="flex-1 overflow-auto"
              emptyMessage="Paste a README.md to preview it."
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <label className="text-sm font-medium text-slate-400">Preview</label>
          <MarkdownPreview
            markdown={input}
            className="flex-1 overflow-auto"
            emptyMessage="Paste a README.md to preview it."
          />
        </div>
      )}
    </div>
  );
};
