// ============================================
// Core Type Definitions for Multi-Format Toolkit
// ============================================

// Supported data formats
export type DataFormat = 'xml' | 'json' | 'markdown';

// Format detection result
export interface FormatDetectionResult {
  format: DataFormat;
  confidence: number; // 0-1
  isValid: boolean;
  error?: string;
}

// Common operation result
export interface OperationResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// Node structure for visualization (unified across formats)
export interface TreeNode {
  id: string;
  type: 'element' | 'attribute' | 'text' | 'object' | 'array' | 'value' | 'heading' | 'paragraph' | 'list' | 'code';
  name: string;
  value?: string;
  attributes?: Record<string, string>;
  children: TreeNode[];
  collapsed?: boolean;
  sourceFormat: DataFormat;
}

// Diff result
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  lineNumber?: number;
  content: string;
  oldContent?: string; // For modified lines
}

export interface DiffResult {
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

// Sort options
export interface SortOptions {
  direction: 'asc' | 'desc';
  sortBy: 'key' | 'value' | 'type';
  recursive: boolean;
  caseSensitive: boolean;
}

// Format options
export interface FormatOptions {
  indentSize: number;
  indentChar: 'space' | 'tab';
  lineEnding: 'lf' | 'crlf';
  wrapLineLength?: number;
}

// Convert options
export interface ConvertOptions {
  preserveAttributes: boolean;
  flattenArrays: boolean;
  includeRootElement: boolean;
  markdownStyle: 'github' | 'commonmark';
}

// Saved template/snippet
export interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  format: DataFormat;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  description?: string;
}

// User workspace data
export interface WorkspaceData {
  id: string;
  name: string;
  tabs: WorkspaceTab[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceTab {
  id: string;
  title: string;
  content: string;
  format: DataFormat;
  isPinned: boolean;
}

// App navigation
export enum AppTab {
  FORMATTER = 'formatter',
  SORTER = 'sorter',
  DIFF = 'diff',
  CONVERTER = 'converter',
  VISUALIZER = 'visualizer',
  AI = 'ai',
  SETTINGS = 'settings'
}

// Hotkey configuration
export interface HotkeyConfig {
  key: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'shift' | 'alt' | 'meta';
}

// Editor state
export interface EditorState {
  content: string;
  format: DataFormat;
  cursorPosition?: { line: number; column: number };
  selection?: { start: number; end: number };
}
