// ============================================
// Unified Formatter - Format, Minify, Beautify
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat } from '../../core';
import { format, minify, detectFormat, validate } from '../../core';
import { addToHistory } from '../../services';
import { FormatSelector, CodeEditor, TemplateManager } from '../../components/common';
import { Button } from '../../components/Button';
import { 
  AlignLeft, Minimize2, Copy, Check, 
  AlertCircle, CheckCircle, Wand2, Download
} from 'lucide-react';

export const UnifiedFormatter: React.FC = () => {
  const [input, setInput] = useState<string>('{\n  "hello": "world",\n  "items": [1, 2, 3]\n}');
  const [output, setOutput] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<DataFormat>('json');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  
  // Auto-detect format
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      if (detected.confidence > 0.5) {
        setInputFormat(detected.format);
      }
      setValidation({ valid: detected.isValid, error: detected.error });
    } else {
      setValidation(null);
    }
  }, [input]);
  
  const handleFormat = () => {
    const result = format(input, inputFormat, { indentSize });
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: inputFormat, operation: 'format' });
    } else {
      setOutput(`Error: ${result.error}`);
    }
  };
  
  const handleMinify = () => {
    const result = minify(input, inputFormat);
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: inputFormat, operation: 'minify' });
    } else {
      setOutput(`Error: ${result.error}`);
    }
  };
  
  const handleAutoFix = () => {
    // Try to format (which often fixes minor issues)
    handleFormat();
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const extensions: Record<DataFormat, string> = {
      xml: 'xml',
      json: 'json',
      markdown: 'md'
    };
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted.${extensions[inputFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleLoadTemplate = (content: string, format: DataFormat) => {
    setInput(content);
    setInputFormat(format);
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <AlignLeft size={20} className="text-primary" />
            Format & Beautify
          </h2>
          
          <FormatSelector value={inputFormat} onChange={setInputFormat} />
          
          {/* Indent Size */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">Indent:</span>
            <select
              value={indentSize}
              onChange={e => setIndentSize(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-200 outline-none"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={1}>Tab</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleFormat} icon={<AlignLeft size={16} />}>
            Format
          </Button>
          <Button variant="secondary" onClick={handleMinify} icon={<Minimize2 size={16} />}>
            Minify
          </Button>
        </div>
      </div>
      
      {/* Validation Status */}
      {validation && (
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm
          ${validation.valid 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }
        `}>
          {validation.valid ? (
            <>
              <CheckCircle size={16} />
              Valid {inputFormat.toUpperCase()}
            </>
          ) : (
            <>
              <AlertCircle size={16} />
              {validation.error || 'Invalid syntax'}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleAutoFix}
                icon={<Wand2 size={12} />}
                className="ml-auto"
              >
                Try to fix
              </Button>
            </>
          )}
        </div>
      )}
      
      {/* Editor Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Input</label>
            <TemplateManager
              currentContent={input}
              currentFormat={inputFormat}
              onLoad={handleLoadTemplate}
              compact
            />
          </div>
          <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
            <CodeEditor
              value={input}
              onChange={setInput}
              format={inputFormat}
              showLineNumbers
              placeholder="Paste your content here..."
            />
          </div>
        </div>
        
        {/* Output */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Output</label>
            {output && (
              <div className="flex gap-1">
                <button
                  onClick={handleDownload}
                  className="text-xs text-primary hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10"
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={handleCopy}
                  className="text-xs text-primary hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 bg-[#162032] border border-slate-700 rounded-lg overflow-hidden">
            <CodeEditor
              value={output}
              format={inputFormat}
              readOnly
              showLineNumbers
              placeholder="Formatted output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
