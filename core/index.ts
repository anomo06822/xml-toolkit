// ============================================
// Core Module Exports
// ============================================

// Types
export * from './types';

// Parser (unified interface)
export {
  detectFormat,
  format,
  minify,
  sort,
  toTree,
  validate,
  convert,
  xmlParser,
  jsonParser,
  markdownParser
} from './parser';

// Diff
export {
  computeDiff,
  computeSemanticDiff,
  toUnifiedDiff,
  isEqual
} from './diff';
export type { DiffOptions } from './diff';
