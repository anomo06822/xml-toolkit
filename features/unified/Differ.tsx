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
const LOG_PREVIEW_LIMIT = 240;

const getDiffLineClasses = (type: DiffResultType['lines'][number]['type']) => {
  switch (type) {
    case 'added':
      return {
        row: 'bg-[var(--dt-diff-added-bg)] text-[var(--dt-diff-added-text)] border-y border-[var(--dt-diff-added-border)]',
        gutter: 'bg-green-500/14 text-green-200 border-r border-[var(--dt-diff-added-border)]',
        sign: 'text-green-200'
      };
    case 'removed':
      return {
        row: 'bg-[var(--dt-diff-removed-bg)] text-[var(--dt-diff-removed-text)] border-y border-[var(--dt-diff-removed-border)]',
        gutter: 'bg-red-500/14 text-red-200 border-r border-[var(--dt-diff-removed-border)]',
        sign: 'text-red-200'
      };
    default:
      return {
        row: 'bg-[var(--dt-diff-neutral-bg)] text-slate-400 border-y border-transparent',
        gutter: 'text-slate-600 border-r border-slate-800/80',
        sign: 'text-slate-700'
      };
  }
};

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
  const createPreview = (content: string, limit = LOG_PREVIEW_LIMIT): string => {
    const normalized = content.trim();
    if (!normalized) return '';
    return normalized.length > limit
      ? `${normalized.slice(0, limit)}...[truncated ${normalized.length - limit} chars]`
      : normalized;
  };
  
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
        requestBody: JSON.stringify({
          model,
          format: detectedFormat.format,
          promptChars: requestBody.contents.length,
          addedLines: diff.stats.added,
          removedLines: diff.stats.removed,
          addedPreview: createPreview(addedLines),
          removedPreview: createPreview(removedLines)
        }, null, 2),
        responseBody: JSON.stringify({
          provider: response.provider,
          textChars: (response.text || '').length,
          textPreview: createPreview(response.text || '')
        }, null, 2),
        success: true
      });
      
      setAiSummaryText(response.text || 'Unable to generate summary.');
    } catch (error: any) {
      console.error('AI Summary error:', error);
      addGeminiApiLog({
        source: 'diff-summary',
        model: getGeminiModel(),
        provider: window.electronAPI?.isElectron ? 'electron-backend' : 'http-backend',
        requestBody: JSON.stringify({
          format: detectedFormat.format,
          leftChars: leftContent.length,
          rightChars: rightContent.length
        }, null, 2),
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
          
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={options.aiSummary}
              onChange={e => setOptions({ ...options, aiSummary: e.target.checked })}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            <Sparkles size={14} className="text-primary" />
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
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <div className="flex gap-2 text-xs flex-wrap">
                  <span className="diff-legend-chip diff-legend-chip-added text-green-200">+{diffResult.stats.added} added</span>
                  <span className="diff-legend-chip diff-legend-chip-removed text-red-200">-{diffResult.stats.removed} removed</span>
                  <span className="diff-legend-chip diff-legend-chip-neutral text-slate-400">{diffResult.stats.unchanged} unchanged</span>
                </div>
                <button
                  onClick={handleCopyDiff}
                  className="text-xs text-primary hover:text-accent flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          
          {/* AI Summary Panel */}
          {(isLoadingSummary || aiSummaryText) && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-medium text-slate-200">AI Summary</span>
              </div>
              {isLoadingSummary ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing differences...
                </div>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed">{aiSummaryText}</p>
              )}
            </div>
          )}
          
          <div className="flex-1 bg-editor border border-slate-700 rounded-lg overflow-auto font-mono text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {!diffResult ? (
              <div className="text-slate-500 text-center mt-20 px-4">
                Click Compare to see differences
              </div>
            ) : diffResult.lines.length === 0 ? (
              <div className="text-green-300 text-center mt-20 px-4">
                ✓ No differences found
              </div>
            ) : (
              <div className="min-w-full">
                {diffResult.lines.map((line, idx) => {
                  const tone = getDiffLineClasses(line.type);
                  const sign = line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' ';

                  return (
                    <div
                      key={idx}
                      className={`
                        grid grid-cols-[2.75rem_1fr] items-start
                        ${tone.row}
                      `}
                    >
                      <div
                        className={`
                          sticky left-0 z-[1] grid grid-cols-[1rem_1fr] items-start gap-2 px-3 py-2 text-[11px]
                          ${tone.gutter}
                        `}
                      >
                        <span className={`font-semibold ${tone.sign}`}>{sign}</span>
                        <span className="tabular-nums opacity-80">{idx + 1}</span>
                      </div>
                      <div className="px-4 py-2 whitespace-pre-wrap break-words leading-6">
                        {line.content || ' '}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
