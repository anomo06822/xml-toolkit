// ============================================
// Unified Differ - Compare XML/JSON/Markdown
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat, DiffResult as DiffResultType, computeDiff, detectFormat, format, sort } from '../../core';
import { FormatSelector, CodeEditor } from '../../components/common';
import { Button } from '../../components/Button';
import { GitCompare, Settings2, ArrowDownAZ, Copy, Check } from 'lucide-react';

export const UnifiedDiffer: React.FC = () => {
  const [leftContent, setLeftContent] = useState<string>('{\n  "name": "old",\n  "value": 1\n}');
  const [rightContent, setRightContent] = useState<string>('{\n  "name": "new",\n  "value": 2,\n  "extra": true\n}');
  const [inputFormat, setInputFormat] = useState<DataFormat>('json');
  const [diffResult, setDiffResult] = useState<DiffResultType | null>(null);
  const [options, setOptions] = useState({
    normalize: true,
    ignoreWhitespace: true,
    ignoreCase: false
  });
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Auto-detect format from left content
  useEffect(() => {
    if (leftContent.trim()) {
      const detected = detectFormat(leftContent);
      if (detected.confidence > 0.5) {
        setInputFormat(detected.format);
      }
    }
  }, [leftContent]);
  
  const handleCompare = () => {
    const result = computeDiff(leftContent, rightContent, inputFormat, options);
    
    if (result.success && result.data) {
      setDiffResult(result.data);
    } else {
      setDiffResult(null);
      alert(`Error: ${result.error}`);
    }
  };
  
  const handleNormalizeInputs = () => {
    // Sort both inputs for normalized comparison
    const sortedLeft = sort(leftContent, inputFormat);
    const sortedRight = sort(rightContent, inputFormat);
    
    if (sortedLeft.success && sortedLeft.data) {
      setLeftContent(sortedLeft.data);
    }
    if (sortedRight.success && sortedRight.data) {
      setRightContent(sortedRight.data);
    }
  };
  
  const handleCopyDiff = () => {
    if (!diffResult) return;
    
    const diffText = diffResult.lines
      .map(line => {
        switch (line.type) {
          case 'added': return `+ ${line.content}`;
          case 'removed': return `- ${line.content}`;
          default: return `  ${line.content}`;
        }
      })
      .join('\n');
    
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <GitCompare size={20} className="text-primary" />
            Compare / Diff
          </h2>
          
          <FormatSelector value={inputFormat} onChange={setInputFormat} />
          
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
          <Button variant="secondary" onClick={handleNormalizeInputs} icon={<ArrowDownAZ size={16} />}>
            Normalize
          </Button>
          <Button onClick={handleCompare} icon={<GitCompare size={16} />}>
            Compare
          </Button>
        </div>
      </div>
      
      {/* Options Panel */}
      {showOptions && (
        <div className="bg-surface border border-slate-700 rounded-lg p-4 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.normalize}
              onChange={e => setOptions({ ...options, normalize: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            Sort before comparing
          </label>
          
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.ignoreWhitespace}
              onChange={e => setOptions({ ...options, ignoreWhitespace: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            Ignore trailing whitespace
          </label>
          
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.ignoreCase}
              onChange={e => setOptions({ ...options, ignoreCase: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            Ignore case
          </label>
        </div>
      )}
      
      {/* Content Area */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Source (Left)</label>
            <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
              <CodeEditor
                value={leftContent}
                onChange={setLeftContent}
                format={inputFormat}
                placeholder="Paste source content..."
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Target (Right)</label>
            <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
              <CodeEditor
                value={rightContent}
                onChange={setRightContent}
                format={inputFormat}
                placeholder="Paste target content..."
              />
            </div>
          </div>
        </div>
        
        {/* Diff Output */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">Diff Result</label>
            {diffResult && (
              <div className="flex items-center gap-4">
                <div className="flex gap-3 text-xs">
                  <span className="text-green-400">+{diffResult.stats.added} added</span>
                  <span className="text-red-400">-{diffResult.stats.removed} removed</span>
                  <span className="text-slate-500">{diffResult.stats.unchanged} unchanged</span>
                </div>
                <button
                  onClick={handleCopyDiff}
                  className="text-xs text-primary hover:text-blue-400 flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-[#162032] border border-slate-700 rounded-lg overflow-auto p-4 font-mono text-sm">
            {!diffResult ? (
              <div className="text-slate-500 text-center mt-20">
                Click Compare to see differences
              </div>
            ) : diffResult.lines.length === 0 ? (
              <div className="text-green-400 text-center mt-20">
                ✓ No differences found
              </div>
            ) : (
              diffResult.lines.map((line, idx) => (
                <div
                  key={idx}
                  className={`
                    px-2 whitespace-pre-wrap border-l-2
                    ${line.type === 'added' ? 'bg-green-900/20 border-green-500 text-green-200' : ''}
                    ${line.type === 'removed' ? 'bg-red-900/20 border-red-500 text-red-200' : ''}
                    ${line.type === 'unchanged' ? 'border-transparent text-slate-400' : ''}
                  `}
                >
                  <span className="inline-block w-6 select-none opacity-50">{idx + 1}</span>
                  {line.type === 'removed' && '- '}
                  {line.type === 'added' && '+ '}
                  {line.type === 'unchanged' && '  '}
                  {line.content}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
