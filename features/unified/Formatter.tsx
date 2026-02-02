// ============================================
// Unified Formatter - Format, Minify, Beautify
// Auto-detects format from input
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat } from '../../core';
import { format, minify, detectFormat } from '../../core';
import { addToHistory } from '../../services';
import { CodeEditor, TemplateManager } from '../../components/common';
import { Button } from '../../components/Button';
import { 
  AlignLeft, Minimize2, Copy, Check, 
  AlertCircle, CheckCircle, Wand2, Download,
  FileCode, Braces, FileText
} from 'lucide-react';

// Format badge component
const FormatBadge: React.FC<{ format: DataFormat; confidence: number }> = ({ format, confidence }) => {
  const icons: Record<DataFormat, React.ReactNode> = {
    xml: <FileCode size={12} />,
    json: <Braces size={12} />,
    markdown: <FileText size={12} />
  };
  
  const colors: Record<DataFormat, string> = {
    xml: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    json: 'bg-green-500/20 text-green-400 border-green-500/30',
    markdown: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[format]}`}>
      {icons[format]}
      <span>{format.toUpperCase()}</span>
      {confidence < 1 && (
        <span className="opacity-60">({Math.round(confidence * 100)}%)</span>
      )}
    </div>
  );
};

export const UnifiedFormatter: React.FC = () => {
  const [input, setInput] = useState<string>('{\n  "hello": "world",\n  "items": [1, 2, 3]\n}');
  const [output, setOutput] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<{ format: DataFormat; confidence: number }>({ format: 'json', confidence: 1 });
  const [indentSize, setIndentSize] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  
  // Auto-detect format whenever input changes
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      setDetectedFormat({ format: detected.format, confidence: detected.confidence });
      setValidation({ valid: detected.isValid, error: detected.error });
    } else {
      setValidation(null);
    }
  }, [input]);
  
  const handleFormat = () => {
    const result = format(input, detectedFormat.format, { indentSize });
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: detectedFormat.format, operation: 'format' });
    } else {
      setOutput(`Error: ${result.error}`);
    }
  };
  
  const handleMinify = () => {
    const result = minify(input, detectedFormat.format);
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: detectedFormat.format, operation: 'minify' });
    } else {
      setOutput(`Error: ${result.error}`);
    }
  };
  
  const handleAutoFix = () => {
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
    a.download = `formatted.${extensions[detectedFormat.format]}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleLoadTemplate = (content: string, format: DataFormat) => {
    setInput(content);
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
          
          {/* Auto-detected format badge */}
          {input.trim() && (
            <FormatBadge format={detectedFormat.format} confidence={detectedFormat.confidence} />
          )}
          
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
              Valid {detectedFormat.format.toUpperCase()}
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
              currentFormat={detectedFormat.format}
              onLoad={handleLoadTemplate}
              compact
            />
          </div>
          <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
            <CodeEditor
              value={input}
              onChange={setInput}
              format={detectedFormat.format}
              showLineNumbers
              placeholder="Paste your XML, JSON, or Markdown here..."
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
              format={detectedFormat.format}
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
