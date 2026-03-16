// ============================================
// Code Editor Component
// ============================================

import React, { useRef, useEffect } from 'react';
import { DataFormat, detectFormat } from '../../core';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  format?: DataFormat;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  showLineNumbers?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onFormatDetected?: (format: DataFormat) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  format,
  readOnly = false,
  placeholder = 'Enter content here...',
  className = '',
  showLineNumbers = false,
  minHeight = '200px',
  maxHeight,
  onFormatDetected
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-detect format when content changes
  useEffect(() => {
    if (onFormatDetected && value.trim()) {
      const detected = detectFormat(value);
      onFormatDetected(detected.format);
    }
  }, [value, onFormatDetected]);
  
  // Get color based on format
  const getTextColor = () => {
    switch (format) {
      case 'xml':
        return 'text-blue-300';
      case 'json':
        return 'text-green-300';
      case 'markdown':
        return 'text-purple-300';
      default:
        return 'text-slate-200';
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea || readOnly) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      onChange?.(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  const lineCount = value.split('\n').length;
  
  return (
    <div className={`relative flex ${className}`} style={{ minHeight, maxHeight }}>
      {showLineNumbers && (
        <div className="flex-shrink-0 w-10 bg-gutter border-r border-slate-700 text-right pr-2 py-4 select-none overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-[10px] text-slate-600 leading-5">
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`
          flex-1 w-full bg-transparent p-4 font-mono text-sm resize-none focus:outline-none selection:bg-primary/20
          ${getTextColor()}
          ${readOnly ? 'cursor-default' : ''}
        `}
        style={{ 
          minHeight,
          maxHeight,
          lineHeight: '1.25rem'
        }}
        spellCheck={false}
      />
    </div>
  );
};
