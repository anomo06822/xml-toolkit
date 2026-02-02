// ============================================
// Unified Converter - Convert Between Formats
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat, convert, detectFormat, format } from '../../core';
import { addToHistory } from '../../services';
import { FormatSelector, CodeEditor, TemplateManager } from '../../components/common';
import { Button } from '../../components/Button';
import { ArrowRight, ArrowLeftRight, Copy, Check, Download, RefreshCw } from 'lucide-react';

export const UnifiedConverter: React.FC = () => {
  const [input, setInput] = useState<string>('<root>\n  <item id="1">Hello</item>\n  <item id="2">World</item>\n</root>');
  const [output, setOutput] = useState<string>('');
  const [fromFormat, setFromFormat] = useState<DataFormat>('xml');
  const [toFormat, setToFormat] = useState<DataFormat>('json');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-detect input format
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      if (detected.confidence > 0.5) {
        setFromFormat(detected.format);
        // Set a sensible default conversion target
        if (detected.format === 'xml') setToFormat('json');
        else if (detected.format === 'json') setToFormat('xml');
        else if (detected.format === 'markdown') setToFormat('json');
      }
    }
  }, []);
  
  const handleConvert = () => {
    setError(null);
    
    const result = convert(input, fromFormat, toFormat);
    
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: toFormat, operation: 'convert' });
    } else {
      setError(result.error || 'Conversion failed');
      setOutput('');
    }
  };
  
  const handleSwap = () => {
    // Swap formats and content
    setFromFormat(toFormat);
    setToFormat(fromFormat);
    setInput(output);
    setOutput('');
  };
  
  const handleFormatInput = () => {
    const result = format(input, fromFormat);
    if (result.success && result.data) {
      setInput(result.data);
    }
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
    a.download = `converted.${extensions[toFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleLoadTemplate = (content: string, format: DataFormat) => {
    setInput(content);
    setFromFormat(format);
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-primary" />
            Convert
          </h2>
          
          <div className="flex items-center gap-2">
            <FormatSelector value={fromFormat} onChange={setFromFormat} size="sm" />
            
            <button
              onClick={handleSwap}
              disabled={!output}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Swap input/output"
            >
              <RefreshCw size={16} />
            </button>
            
            <FormatSelector value={toFormat} onChange={setToFormat} size="sm" />
          </div>
        </div>
        
        <Button onClick={handleConvert} icon={<ArrowRight size={16} />}>
          Convert
        </Button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          Error: {error}
        </div>
      )}
      
      {/* Editor Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              Input
              <span className={`
                text-[10px] font-bold px-1.5 py-0.5 rounded
                ${fromFormat === 'xml' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${fromFormat === 'json' ? 'bg-green-500/20 text-green-400' : ''}
                ${fromFormat === 'markdown' ? 'bg-purple-500/20 text-purple-400' : ''}
              `}>
                {fromFormat.toUpperCase()}
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleFormatInput}
                className="text-xs text-primary hover:text-blue-400 px-2 py-1 rounded hover:bg-primary/10"
              >
                Format
              </button>
              <TemplateManager
                currentContent={input}
                currentFormat={fromFormat}
                onLoad={handleLoadTemplate}
                compact
              />
            </div>
          </div>
          <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
            <CodeEditor
              value={input}
              onChange={setInput}
              format={fromFormat}
              showLineNumbers
              placeholder="Paste content to convert..."
            />
          </div>
        </div>
        
        {/* Output */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              Output
              <span className={`
                text-[10px] font-bold px-1.5 py-0.5 rounded
                ${toFormat === 'xml' ? 'bg-blue-500/20 text-blue-400' : ''}
                ${toFormat === 'json' ? 'bg-green-500/20 text-green-400' : ''}
                ${toFormat === 'markdown' ? 'bg-purple-500/20 text-purple-400' : ''}
              `}>
                {toFormat.toUpperCase()}
              </span>
            </label>
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
              format={toFormat}
              readOnly
              showLineNumbers
              placeholder="Converted output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
