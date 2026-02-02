// ============================================
// Diff Service - Compare Any Format
// ============================================

import { DiffResult, DiffLine, DataFormat, OperationResult } from './types';
import { detectFormat, format, sort } from './parser';

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  normalize: boolean; // Sort before diff
  contextLines: number;
}

const defaultOptions: DiffOptions = {
  ignoreWhitespace: true,
  ignoreCase: false,
  normalize: false,
  contextLines: 3
};

// Compute diff between two texts
export const computeDiff = (
  oldText: string, 
  newText: string, 
  formatType?: DataFormat,
  options: Partial<DiffOptions> = {}
): OperationResult<DiffResult> => {
  const opts = { ...defaultOptions, ...options };
  
  try {
    let oldContent = oldText;
    let newContent = newText;
    const detectedFormat = formatType || detectFormat(oldText).format;
    
    // Normalize if requested
    if (opts.normalize) {
      const sortedOld = sort(oldContent, detectedFormat);
      const sortedNew = sort(newContent, detectedFormat);
      
      if (sortedOld.success && sortedOld.data) oldContent = sortedOld.data;
      if (sortedNew.success && sortedNew.data) newContent = sortedNew.data;
    } else {
      // At least format for consistent comparison
      const formattedOld = format(oldContent, detectedFormat);
      const formattedNew = format(newContent, detectedFormat);
      
      if (formattedOld.success && formattedOld.data) oldContent = formattedOld.data;
      if (formattedNew.success && formattedNew.data) newContent = formattedNew.data;
    }
    
    // Preprocess based on options
    if (opts.ignoreWhitespace) {
      oldContent = oldContent.replace(/\s+$/gm, '');
      newContent = newContent.replace(/\s+$/gm, '');
    }
    
    // Split into lines
    let oldLines = oldContent.split('\n');
    let newLines = newContent.split('\n');
    
    if (opts.ignoreCase) {
      oldLines = oldLines.map(l => l.toLowerCase());
      newLines = newLines.map(l => l.toLowerCase());
    }
    
    // LCS-based diff algorithm
    const diffLines = computeLCSDiff(
      opts.ignoreCase ? oldContent.toLowerCase().split('\n') : oldContent.split('\n'),
      opts.ignoreCase ? newContent.toLowerCase().split('\n') : newContent.split('\n'),
      oldContent.split('\n'),
      newContent.split('\n')
    );
    
    // Calculate stats
    const stats = {
      added: diffLines.filter(l => l.type === 'added').length,
      removed: diffLines.filter(l => l.type === 'removed').length,
      modified: diffLines.filter(l => l.type === 'modified').length,
      unchanged: diffLines.filter(l => l.type === 'unchanged').length
    };
    
    return {
      success: true,
      data: { lines: diffLines, stats }
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// LCS-based diff algorithm
const computeLCSDiff = (
  oldLinesNormalized: string[],
  newLinesNormalized: string[],
  oldLinesOriginal: string[],
  newLinesOriginal: string[]
): DiffLine[] => {
  const m = oldLinesNormalized.length;
  const n = newLinesNormalized.length;
  
  // Build LCS table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLinesNormalized[i - 1] === newLinesNormalized[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Backtrack to build diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  
  const tempResult: DiffLine[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLinesNormalized[i - 1] === newLinesNormalized[j - 1]) {
      tempResult.push({
        type: 'unchanged',
        lineNumber: i,
        content: oldLinesOriginal[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempResult.push({
        type: 'added',
        lineNumber: j,
        content: newLinesOriginal[j - 1]
      });
      j--;
    } else if (i > 0) {
      tempResult.push({
        type: 'removed',
        lineNumber: i,
        content: oldLinesOriginal[i - 1]
      });
      i--;
    }
  }
  
  // Reverse since we built it backwards
  return tempResult.reverse();
};

// Semantic diff for structured formats
export const computeSemanticDiff = (
  oldText: string,
  newText: string,
  formatType?: DataFormat
): OperationResult<any> => {
  const format = formatType || detectFormat(oldText).format;
  
  // For structured formats, we could do a tree-based diff
  // This is a placeholder for future enhancement
  return computeDiff(oldText, newText, format, { normalize: true });
};

// Generate unified diff format string
export const toUnifiedDiff = (diff: DiffResult, oldName = 'old', newName = 'new'): string => {
  const lines: string[] = [
    `--- ${oldName}`,
    `+++ ${newName}`,
    '@@ diff @@'
  ];
  
  for (const line of diff.lines) {
    switch (line.type) {
      case 'added':
        lines.push(`+ ${line.content}`);
        break;
      case 'removed':
        lines.push(`- ${line.content}`);
        break;
      case 'modified':
        lines.push(`- ${line.oldContent || ''}`);
        lines.push(`+ ${line.content}`);
        break;
      default:
        lines.push(`  ${line.content}`);
    }
  }
  
  return lines.join('\n');
};

// Check if two contents are equal (after normalization)
export const isEqual = (
  content1: string, 
  content2: string, 
  formatType?: DataFormat,
  options: Partial<DiffOptions> = {}
): boolean => {
  const result = computeDiff(content1, content2, formatType, options);
  if (!result.success || !result.data) return false;
  
  const { stats } = result.data;
  return stats.added === 0 && stats.removed === 0 && stats.modified === 0;
};
