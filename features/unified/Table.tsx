// ============================================
// Unified Table Editor - Markdown Table with Live Preview
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../../components/Button';
import { MarkdownPreview } from '../../components/common';
import { formatShortcut, isPrimaryShortcut } from '../../services';
import { 
  Table2, Plus, Trash2, Copy, Check, Download,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  AlignLeft, AlignCenter, AlignRight, Eye, Code
} from 'lucide-react';

type Alignment = 'left' | 'center' | 'right';

interface TableData {
  headers: string[];
  alignments: Alignment[];
  rows: string[][];
}

// Convert table data to markdown
const tableToMarkdown = (data: TableData): string => {
  if (data.headers.length === 0) return '';
  
  const { headers, alignments, rows } = data;
  
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const cellWidths = [h.length, ...rows.map(row => (row[i] || '').length)];
    return Math.max(...cellWidths, 3); // Minimum 3 for alignment markers
  });
  
  // Header row
  const headerRow = '| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |';
  
  // Separator row with alignment
  const separatorRow = '| ' + alignments.map((align, i) => {
    const width = colWidths[i];
    switch (align) {
      case 'left': return ':' + '-'.repeat(width - 1);
      case 'center': return ':' + '-'.repeat(width - 2) + ':';
      case 'right': return '-'.repeat(width - 1) + ':';
    }
  }).join(' | ') + ' |';
  
  // Data rows
  const dataRows = rows.map(row => 
    '| ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ') + ' |'
  );
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
};

// Parse markdown to table data
const markdownToTable = (md: string): TableData | null => {
  const lines = md.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;
  
  const parseRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  };
  
  const headers = parseRow(lines[0]);
  
  // Parse separator for alignment
  const sepLine = lines[1];
  const alignments: Alignment[] = parseRow(sepLine).map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });
  
  const rows = lines.slice(2).map(parseRow);
  
  return { headers, alignments, rows };
};


export const UnifiedTable: React.FC = () => {
  const [tableData, setTableData] = useState<TableData>({
    headers: ['Name', 'Type', 'Description'],
    alignments: ['left', 'left', 'left'],
    rows: [
      ['id', 'number', 'Unique identifier'],
      ['name', 'string', 'Display name'],
      ['active', 'boolean', 'Is active flag'],
    ]
  });
  
  const [viewMode, setViewMode] = useState<'edit' | 'markdown' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [markdownInput, setMarkdownInput] = useState('');

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPrimaryShortcut(e) || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      if (key === 'd') {
        e.preventDefault();
        handleDownload();
      }
      if (key === 'r') {
        e.preventDefault();
        addRow();
      }
      if (key === 'l') {
        e.preventDefault();
        addColumn();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
  
  // Generate markdown from current table
  const markdown = useMemo(() => tableToMarkdown(tableData), [tableData]);
  
  // Cell update handler
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setTableData(prev => {
      const newRows = [...prev.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = value;
      return { ...prev, rows: newRows };
    });
  }, []);
  
  // Header update handler
  const updateHeader = useCallback((colIndex: number, value: string) => {
    setTableData(prev => {
      const newHeaders = [...prev.headers];
      newHeaders[colIndex] = value;
      return { ...prev, headers: newHeaders };
    });
  }, []);
  
  // Add column
  const addColumn = useCallback(() => {
    setTableData(prev => ({
      headers: [...prev.headers, `Column ${prev.headers.length + 1}`],
      alignments: [...prev.alignments, 'left'],
      rows: prev.rows.map(row => [...row, ''])
    }));
  }, []);
  
  // Remove column
  const removeColumn = useCallback((colIndex: number) => {
    if (tableData.headers.length <= 1) return;
    setTableData(prev => ({
      headers: prev.headers.filter((_, i) => i !== colIndex),
      alignments: prev.alignments.filter((_, i) => i !== colIndex),
      rows: prev.rows.map(row => row.filter((_, i) => i !== colIndex))
    }));
  }, [tableData.headers.length]);
  
  // Add row
  const addRow = useCallback(() => {
    setTableData(prev => ({
      ...prev,
      rows: [...prev.rows, new Array(prev.headers.length).fill('')]
    }));
  }, []);
  
  // Remove row
  const removeRow = useCallback((rowIndex: number) => {
    setTableData(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIndex)
    }));
  }, []);
  
  // Move row
  const moveRow = useCallback((rowIndex: number, direction: 'up' | 'down') => {
    setTableData(prev => {
      const newRows = [...prev.rows];
      const targetIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
      if (targetIndex < 0 || targetIndex >= newRows.length) return prev;
      [newRows[rowIndex], newRows[targetIndex]] = [newRows[targetIndex], newRows[rowIndex]];
      return { ...prev, rows: newRows };
    });
  }, []);
  
  // Move column
  const moveColumn = useCallback((colIndex: number, direction: 'left' | 'right') => {
    setTableData(prev => {
      const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.headers.length) return prev;
      
      const swapArray = <T,>(arr: T[]): T[] => {
        const newArr = [...arr];
        [newArr[colIndex], newArr[targetIndex]] = [newArr[targetIndex], newArr[colIndex]];
        return newArr;
      };
      
      return {
        headers: swapArray(prev.headers),
        alignments: swapArray(prev.alignments),
        rows: prev.rows.map(swapArray)
      };
    });
  }, []);
  
  // Toggle alignment
  const toggleAlignment = useCallback((colIndex: number) => {
    setTableData(prev => {
      const newAlignments = [...prev.alignments];
      const current = newAlignments[colIndex];
      newAlignments[colIndex] = current === 'left' ? 'center' : current === 'center' ? 'right' : 'left';
      return { ...prev, alignments: newAlignments };
    });
  }, []);
  
  // Copy markdown
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);
  
  // Download markdown
  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);
  
  // Parse markdown input
  const handleMarkdownChange = useCallback((md: string) => {
    setMarkdownInput(md);
    const parsed = markdownToTable(md);
    if (parsed) {
      setTableData(parsed);
    }
  }, []);
  
  // Alignment icon
  const AlignIcon: React.FC<{ align: Alignment }> = ({ align }) => {
    switch (align) {
      case 'center': return <AlignCenter size={12} />;
      case 'right': return <AlignRight size={12} />;
      default: return <AlignLeft size={12} />;
    }
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Table2 size={20} className="text-primary" />
            Markdown Table Editor
          </h2>
          
          {/* View mode toggle */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                viewMode === 'edit' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table2 size={14} className="inline mr-1" />
              Edit
            </button>
            <button
              onClick={() => {
                setViewMode('markdown');
                setMarkdownInput(markdown);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                viewMode === 'markdown' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code size={14} className="inline mr-1" />
              Markdown
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                viewMode === 'preview' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye size={14} className="inline mr-1" />
              Preview
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? 'Copied!' : `Copy (${formatShortcut('C', true)})`}
          </Button>
          <Button variant="secondary" onClick={handleDownload} icon={<Download size={16} />}>
            Download ({formatShortcut('D', true)})
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {viewMode === 'edit' && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex gap-2 bg-surface p-3 rounded-lg border border-slate-700">
              <Button size="sm" onClick={addColumn} icon={<Plus size={14} />}>
                Add Column ({formatShortcut('L', true)})
              </Button>
              <Button size="sm" onClick={addRow} icon={<Plus size={14} />}>
                Add Row ({formatShortcut('R', true)})
              </Button>
              <div className="flex-1" />
              <span className="text-xs text-slate-500 self-center">
                {tableData.headers.length} columns, {tableData.rows.length} rows
              </span>
            </div>
            
            {/* Table editor */}
            <div className="flex-1 overflow-auto bg-surface border border-slate-700 rounded-lg p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-20"></th>
                    {tableData.headers.map((header, colIndex) => (
                      <th key={colIndex} className="border border-slate-600 bg-slate-800 p-0">
                        <div className="flex flex-col">
                          <input
                            type="text"
                            value={header}
                            onChange={e => updateHeader(colIndex, e.target.value)}
                            className="bg-transparent px-3 py-2 text-slate-200 font-semibold text-center outline-none border-b border-slate-600"
                            placeholder="Header"
                          />
                          <div className="flex justify-center gap-1 py-1 bg-slate-900/50">
                            <button
                              onClick={() => toggleAlignment(colIndex)}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
                              title="Toggle alignment"
                            >
                              <AlignIcon align={tableData.alignments[colIndex]} />
                            </button>
                            <button
                              onClick={() => moveColumn(colIndex, 'left')}
                              disabled={colIndex === 0}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded disabled:opacity-30"
                              title="Move left"
                            >
                              <ArrowLeft size={12} />
                            </button>
                            <button
                              onClick={() => moveColumn(colIndex, 'right')}
                              disabled={colIndex === tableData.headers.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded disabled:opacity-30"
                              title="Move right"
                            >
                              <ArrowRight size={12} />
                            </button>
                            <button
                              onClick={() => removeColumn(colIndex)}
                              disabled={tableData.headers.length <= 1}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded disabled:opacity-30"
                              title="Remove column"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="border border-slate-700 bg-slate-900/50 p-1">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-500">{rowIndex + 1}</span>
                          <button
                            onClick={() => moveRow(rowIndex, 'up')}
                            disabled={rowIndex === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button
                            onClick={() => moveRow(rowIndex, 'down')}
                            disabled={rowIndex === tableData.rows.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown size={10} />
                          </button>
                          <button
                            onClick={() => removeRow(rowIndex)}
                            className="p-0.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                            title="Remove row"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                      {row.map((cell, colIndex) => (
                        <td 
                          key={colIndex} 
                          className={`border border-slate-700 p-0 ${rowIndex % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/20'}`}
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={e => updateCell(rowIndex, colIndex, e.target.value)}
                            className="w-full bg-transparent px-3 py-2 text-slate-300 outline-none focus:bg-slate-800/50"
                            style={{ textAlign: tableData.alignments[colIndex] }}
                            placeholder="..."
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {viewMode === 'markdown' && (
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Markdown Source</label>
            <textarea
              value={markdownInput}
              onChange={e => handleMarkdownChange(e.target.value)}
              className="flex-1 bg-surface border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 outline-none focus:border-primary resize-none"
              placeholder="Paste or edit markdown table here..."
              spellCheck={false}
            />
            <p className="text-xs text-slate-500">
              Edit the markdown directly. Changes will update the table editor.
            </p>
          </div>
        )}
        
        {viewMode === 'preview' && (
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400">Preview</label>
            <MarkdownPreview
              markdown={markdown}
              className="flex-1 overflow-auto"
            />
          </div>
        )}
        
        {/* Side panel: Always show markdown output */}
        {viewMode === 'edit' && (
          <div className="w-96 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-400">Generated Markdown</label>
              <button
                onClick={handleCopy}
                className="text-xs text-primary hover:text-blue-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="flex-1 bg-[#162032] border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre">
              {markdown}
            </pre>
            
            {/* Preview */}
            <label className="text-sm font-medium text-slate-400 mt-2">Preview</label>
            <MarkdownPreview
              markdown={markdown}
              className="h-48 overflow-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};
