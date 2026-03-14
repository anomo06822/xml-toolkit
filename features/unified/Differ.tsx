// ============================================
// Unified Differ - Compare XML/JSON/Markdown
// Auto-detects format, AI-powered summary
// ============================================

import React, { useState, useEffect } from 'react';
import { DataFormat, DiffResult as DiffResultType, computeDiff, detectFormat, sort } from '../../core';
import { CodeEditor } from '../../components/common';
import { Button } from '../../components/Button';
import { addGeminiApiLog, formatShortcut, generateGeminiContent, getGeminiModel, isPrimaryShortcut, setAiContextByFormat } from '../../services';
import { GitCompare, Settings2, ArrowDownAZ, Copy, Check, Sparkles, Loader2, FileCode, Braces, FileText } from 'lucide-react';

const SAMPLE_DIFF_LEFT = `{
  "name": "old",
  "value": 1
}`;

const SAMPLE_DIFF_RIGHT = `{
  "name": "new",
  "value": 2,
  "extra": true
}`;

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

export const UnifiedDiffer: React.FC = () => {
  const [leftContent, setLeftContent] = useState<string>('');
  const [rightContent, setRightContent] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<{ format: DataFormat; confidence: number }>({ format: 'json', confidence: 1 });
  const [diffResult, setDiffResult] = useState<DiffResultType | null>(null);
  const [options, setOptions] = useState({
    normalize: true,
    ignoreWhitespace: true,
    ignoreCase: false,
    aiSummary: false
  });
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  // Auto-detect format from left content
  useEffect(() => {
    if (leftContent.trim()) {
      const detected = detectFormat(leftContent);
      setDetectedFormat({ format: detected.format, confidence: detected.confidence });
      setAiContextByFormat(detected.format, leftContent, 'differ:left');
    }
  }, [leftContent]);

  useEffect(() => {
    if (rightContent.trim()) {
      setAiContextByFormat(detectedFormat.format, rightContent, 'differ:right');
    }
  }, [rightContent, detectedFormat.format]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPrimaryShortcut(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleCompare();
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleNormalizeInputs();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
  
  const generateAiSummary = async (diff: DiffResultType) => {
    setIsLoadingSummary(true);
    setAiSummaryText(null);
    
    try {
      const model = getGeminiModel();
      
      // Build diff summary for AI
      const addedLines = diff.lines.filter(l => l.type === 'added').map(l => `+ ${l.content}`).join('\n');
      const removedLines = diff.lines.filter(l => l.type === 'removed').map(l => `- ${l.content}`).join('\n');
      
      const prompt = `Analyze the following diff and provide a concise summary of the changes in 2-3 sentences. Focus on what was added, removed, or modified at a semantic level.

Format: ${detectedFormat.format.toUpperCase()}

Statistics:
- ${diff.stats.added} lines added
- ${diff.stats.removed} lines removed
- ${diff.stats.unchanged} lines unchanged

Added lines:
${addedLines || '(none)'}

Removed lines:
${removedLines || '(none)'}

Please provide a clear, technical summary of the changes:`;

      const requestBody = {
        model,
        contents: prompt
      };
      const response = await generateGeminiContent({
        model,
        contents: prompt
      });
      addGeminiApiLog({
        source: 'diff-summary',
        model,
        provider: response.provider,
        requestBody: JSON.stringify(requestBody, null, 2),
        responseBody: JSON.stringify({ provider: response.provider, text: response.text || '' }, null, 2),
        success: true
      });
      
      setAiSummaryText(response.text || 'Unable to generate summary.');
    } catch (error: any) {
      console.error('AI Summary error:', error);
      addGeminiApiLog({
        source: 'diff-summary',
        model: getGeminiModel(),
        provider: window.electronAPI?.isElectron ? 'electron-backend' : 'http-backend',
        requestBody: JSON.stringify({ format: detectedFormat.format }, null, 2),
        error: error?.message || 'Unknown error',
        success: false
      });
      setAiSummaryText(`⚠️ Error generating summary: ${error.message}`);
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  const handleCompare = async () => {
    const result = computeDiff(leftContent, rightContent, detectedFormat.format, options);
    
    if (result.success && result.data) {
      setDiffResult(result.data);
      setAiSummaryText(null);
      
      // Generate AI summary if enabled
      if (options.aiSummary && result.data.stats.added + result.data.stats.removed > 0) {
        await generateAiSummary(result.data);
      }
    } else {
      setDiffResult(null);
      alert(`Error: ${result.error}`);
    }
  };
  
  const handleNormalizeInputs = () => {
    const sortedLeft = sort(leftContent, detectedFormat.format);
    const sortedRight = sort(rightContent, detectedFormat.format);
    
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
          
          {/* Auto-detected format badge */}
          {leftContent.trim() && (
            <FormatBadge format={detectedFormat.format} confidence={detectedFormat.confidence} />
          )}
          
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
            Normalize <span className="ml-1 opacity-70">({formatShortcut('Enter', true)})</span>
          </Button>
          <Button onClick={handleCompare} icon={<GitCompare size={16} />}>
            Compare <span className="ml-1 opacity-70">({formatShortcut('Enter')})</span>
          </Button>
        </div>
      </div>
      
      {/* Options Panel */}
      {showOptions && (
        <div className="bg-surface border border-slate-700 rounded-lg p-4 flex flex-wrap gap-6">
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
          
          <div className="w-px bg-slate-700 mx-2" />
          
          <label className="flex items-center gap-2 text-sm text-purple-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.aiSummary}
              onChange={e => setOptions({ ...options, aiSummary: e.target.checked })}
              className="rounded border-purple-600 text-purple-500 focus:ring-purple-500 bg-slate-800"
            />
            <Sparkles size={14} className="text-purple-400" />
            AI Summary (Gemini)
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
                format={detectedFormat.format}
                placeholder={SAMPLE_DIFF_LEFT}
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Target (Right)</label>
            <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
              <CodeEditor
                value={rightContent}
                onChange={setRightContent}
                format={detectedFormat.format}
                placeholder={SAMPLE_DIFF_RIGHT}
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
          
          {/* AI Summary Panel */}
          {(isLoadingSummary || aiSummaryText) && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs font-medium text-purple-300">AI Summary</span>
              </div>
              {isLoadingSummary ? (
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing differences...
                </div>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed">{aiSummaryText}</p>
              )}
            </div>
          )}
          
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
