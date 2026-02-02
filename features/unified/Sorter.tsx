// ============================================
// Unified Sorter - Sort XML/JSON/Markdown
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat, SortOptions } from '../../core';
import { sort, detectFormat } from '../../core';
import { addToHistory } from '../../services';
import { FormatSelector, CodeEditor, TemplateManager } from '../../components/common';
import { Button } from '../../components/Button';
import { ArrowDownAZ, ArrowUpZA, Copy, Check, Settings2 } from 'lucide-react';

export const UnifiedSorter: React.FC = () => {
  const [input, setInput] = useState<string>('<root>\n  <zebra>Value</zebra>\n  <apple>Value</apple>\n  <mango>Value</mango>\n</root>');
  const [output, setOutput] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<DataFormat>('xml');
  const [sortOptions, setSortOptions] = useState<Partial<SortOptions>>({
    direction: 'asc',
    recursive: true,
    caseSensitive: false
  });
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Auto-detect format
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      if (detected.confidence > 0.5) {
        setInputFormat(detected.format);
      }
    }
  }, [input]);
  
  const handleSort = (direction: 'asc' | 'desc') => {
    const options = { ...sortOptions, direction };
    const result = sort(input, inputFormat, options);
    
    if (result.success && result.data) {
      setOutput(result.data);
      addToHistory({ content: result.data, format: inputFormat, operation: 'sort' });
    } else {
      setOutput(`Error: ${result.error}`);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <ArrowDownAZ size={20} className="text-primary" />
            Sort
          </h2>
          
          <FormatSelector value={inputFormat} onChange={setInputFormat} />
          
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
            Sort A→Z
          </Button>
          <Button variant="secondary" onClick={() => handleSort('desc')} icon={<ArrowUpZA size={16} />}>
            Sort Z→A
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
              placeholder="Paste content to sort..."
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
              format={inputFormat}
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
