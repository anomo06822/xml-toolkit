// ============================================
// Unified Sorter - Sort XML/JSON/Markdown
// Auto-detects format from input
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat, SortOptions } from '../../core';
import { sort, format, detectFormat } from '../../core';
import { addToHistory, formatShortcut, isPrimaryShortcut, setAiContextByFormat } from '../../services';
import { CodeEditor, TemplateManager } from '../../components/common';
import { Button } from '../../components/Button';
import { ArrowDownAZ, ArrowUpZA, Copy, Check, Settings2, FileCode, Braces, FileText } from 'lucide-react';

const SAMPLE_SORTER_INPUT = `<root>
  <zebra>Value</zebra>
  <apple>Value</apple>
  <mango>Value</mango>
</root>`;

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

export const UnifiedSorter: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<{ format: DataFormat; confidence: number }>({ format: 'xml', confidence: 1 });
  const [sortOptions, setSortOptions] = useState<Partial<SortOptions>>({
    direction: 'asc',
    recursive: true,
    caseSensitive: false
  });
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Auto-detect format whenever input changes
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      setDetectedFormat({ format: detected.format, confidence: detected.confidence });
      setAiContextByFormat(detected.format, input, 'sorter:input');
    }
  }, [input]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPrimaryShortcut(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSort('asc');
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSort('desc');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
  
  const handleSort = (direction: 'asc' | 'desc') => {
    const options = { ...sortOptions, direction };
    const sortResult = sort(input, detectedFormat.format, options);
    
    if (sortResult.success && sortResult.data) {
      // Sort already returns formatted output, but let's ensure it's properly formatted
      const formatResult = format(sortResult.data, detectedFormat.format, { indentSize: 2 });
      const finalOutput = formatResult.success && formatResult.data ? formatResult.data : sortResult.data;
      
      setOutput(finalOutput);
      addToHistory({ content: finalOutput, format: detectedFormat.format, operation: 'sort' });
      setAiContextByFormat(detectedFormat.format, finalOutput, 'sorter:output');
    } else {
      setOutput(`Error: ${sortResult.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleLoadTemplate = (content: string, _format: DataFormat) => {
    setInput(content);
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ArrowDownAZ size={20} className="text-primary" />
            Sort
          </h2>
          
          {/* Auto-detected format badge */}
          {input.trim() && (
            <FormatBadge format={detectedFormat.format} confidence={detectedFormat.confidence} />
          )}
          
          {/* Options Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs
              ${showOptions 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
              }
            `}
          >
            <Settings2 size={14} />
            Options
          </button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => handleSort('asc')} icon={<ArrowDownAZ size={16} />}>
            Sort A→Z <span className="ml-1 opacity-70">({formatShortcut('Enter')})</span>
          </Button>
          <Button variant="secondary" onClick={() => handleSort('desc')} icon={<ArrowUpZA size={16} />}>
            Sort Z→A <span className="ml-1 opacity-70">({formatShortcut('Enter', true)})</span>
          </Button>
        </div>
      </div>
      
      {/* Options Panel */}
      {showOptions && (
        <div className="bg-surface border border-slate-700 rounded-lg p-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={sortOptions.recursive}
              onChange={e => setSortOptions({ ...sortOptions, recursive: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            Recursive (sort nested elements)
          </label>
          
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={sortOptions.caseSensitive}
              onChange={e => setSortOptions({ ...sortOptions, caseSensitive: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            Case sensitive
          </label>
        </div>
      )}
      
      {/* Editor Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Original</label>
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
              placeholder={SAMPLE_SORTER_INPUT}
            />
          </div>
        </div>
        
        {/* Output */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Sorted</label>
            {output && (
              <button
                onClick={handleCopy}
                className="text-xs text-primary hover:text-blue-400 flex items-center gap-1"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="flex-1 bg-[#162032] border border-slate-700 rounded-lg overflow-hidden">
            <CodeEditor
              value={output}
              format={detectedFormat.format}
              readOnly
              showLineNumbers
              placeholder="Sorted output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
