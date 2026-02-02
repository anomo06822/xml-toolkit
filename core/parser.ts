// ============================================
// Unified Parser - Format Detection & Routing
// ============================================

import { DataFormat, FormatDetectionResult, OperationResult, TreeNode, FormatOptions, SortOptions } from './types';
import * as xmlParser from './parsers/xmlParser';
import * as jsonParser from './parsers/jsonParser';
import * as markdownParser from './parsers/markdownParser';

// Detect the format of input content
export const detectFormat = (content: string): FormatDetectionResult => {
  const trimmed = content.trim();
  
  if (!trimmed) {
    return { format: 'json', confidence: 0, isValid: false, error: 'Empty content' };
  }
  
  // Check for XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    const xmlResult = xmlParser.validateXml(trimmed);
    if (xmlResult.success) {
      return { format: 'xml', confidence: 1, isValid: true };
    }
    // Might be malformed XML
    if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.includes('</'))) {
      return { format: 'xml', confidence: 0.7, isValid: false, error: xmlResult.error };
    }
  }
  
  // Check for JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const jsonResult = jsonParser.validateJson(trimmed);
    if (jsonResult.success) {
      return { format: 'json', confidence: 1, isValid: true };
    }
    return { format: 'json', confidence: 0.8, isValid: false, error: jsonResult.error };
  }
  
  // Check for Markdown indicators
  const hasHeadings = /^#{1,6}\s+/m.test(trimmed);
  const hasCodeBlocks = /```[\s\S]*```/.test(trimmed);
  const hasLists = /^[-*+]\s+/m.test(trimmed) || /^\d+\.\s+/m.test(trimmed);
  const hasLinks = /\[.+\]\(.+\)/.test(trimmed);
  const hasBold = /\*\*[^*]+\*\*/.test(trimmed) || /__[^_]+__/.test(trimmed);
  
  const mdScore = [hasHeadings, hasCodeBlocks, hasLists, hasLinks, hasBold].filter(Boolean).length;
  
  if (mdScore >= 1) {
    return { format: 'markdown', confidence: 0.5 + (mdScore * 0.1), isValid: true };
  }
  
  // Default to markdown for plain text
  return { format: 'markdown', confidence: 0.3, isValid: true };
};

// Unified format function
export const format = (content: string, formatType?: DataFormat, options: Partial<FormatOptions> = {}): OperationResult<string> => {
  const format = formatType || detectFormat(content).format;
  
  switch (format) {
    case 'xml':
      return xmlParser.formatXml(content, options);
    case 'json':
      return jsonParser.formatJson(content, options);
    case 'markdown':
      return markdownParser.formatMarkdown(content, options);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
};

// Unified minify function
export const minify = (content: string, formatType?: DataFormat): OperationResult<string> => {
  const format = formatType || detectFormat(content).format;
  
  switch (format) {
    case 'xml':
      return xmlParser.minifyXml(content);
    case 'json':
      return jsonParser.minifyJson(content);
    case 'markdown':
      return markdownParser.minifyMarkdown(content);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
};

// Unified sort function
export const sort = (content: string, formatType?: DataFormat, options: Partial<SortOptions> = {}): OperationResult<string> => {
  const format = formatType || detectFormat(content).format;
  
  switch (format) {
    case 'xml':
      return xmlParser.sortXml(content, options);
    case 'json':
      return jsonParser.sortJson(content, options);
    case 'markdown':
      return markdownParser.sortMarkdown(content, options);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
};

// Unified tree conversion
export const toTree = (content: string, formatType?: DataFormat): OperationResult<TreeNode> => {
  const format = formatType || detectFormat(content).format;
  
  switch (format) {
    case 'xml':
      return xmlParser.xmlToTree(content);
    case 'json':
      return jsonParser.jsonToTree(content);
    case 'markdown':
      return markdownParser.markdownToTree(content);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
};

// Unified validate function
export const validate = (content: string, formatType?: DataFormat): OperationResult<boolean> => {
  const format = formatType || detectFormat(content).format;
  
  switch (format) {
    case 'xml':
      return xmlParser.validateXml(content);
    case 'json':
      return jsonParser.validateJson(content);
    case 'markdown':
      return markdownParser.validateMarkdown(content);
    default:
      return { success: false, error: `Unknown format: ${format}` };
  }
};

// Convert between formats
export const convert = (
  content: string, 
  fromFormat: DataFormat, 
  toFormat: DataFormat
): OperationResult<string> => {
  if (fromFormat === toFormat) {
    return format(content, fromFormat);
  }
  
  // XML conversions
  if (fromFormat === 'xml') {
    if (toFormat === 'json') {
      const result = xmlParser.xmlToJson(content);
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: JSON.stringify(result.data, null, 2) };
    }
    if (toFormat === 'markdown') {
      // XML -> JSON -> Markdown structure
      const jsonResult = xmlParser.xmlToJson(content);
      if (!jsonResult.success) return { success: false, error: jsonResult.error };
      return jsonToMarkdown(JSON.stringify(jsonResult.data));
    }
  }
  
  // JSON conversions
  if (fromFormat === 'json') {
    if (toFormat === 'xml') {
      return jsonParser.jsonToXml(content);
    }
    if (toFormat === 'markdown') {
      return jsonToMarkdown(content);
    }
  }
  
  // Markdown conversions
  if (fromFormat === 'markdown') {
    if (toFormat === 'json') {
      const result = markdownParser.markdownToJson(content);
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: JSON.stringify(result.data, null, 2) };
    }
    if (toFormat === 'xml') {
      return markdownParser.markdownToXml(content);
    }
  }
  
  return { success: false, error: `Conversion from ${fromFormat} to ${toFormat} is not supported` };
};

// Helper: JSON to Markdown
const jsonToMarkdown = (jsonStr: string): OperationResult<string> => {
  try {
    const data = JSON.parse(jsonStr);
    const md = objectToMarkdown(data, 0);
    return { success: true, data: md.trim() };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

const objectToMarkdown = (obj: any, depth: number): string => {
  let md = '';
  const indent = '  '.repeat(depth);
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        md += objectToMarkdown(item, depth);
      } else {
        md += `${indent}- ${item}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('@')) continue; // Skip XML attributes
      
      if (typeof value === 'object' && value !== null) {
        if (depth === 0) {
          md += `## ${key}\n\n`;
        } else {
          md += `${indent}**${key}:**\n`;
        }
        md += objectToMarkdown(value, depth + 1);
      } else {
        md += `${indent}- **${key}:** ${value}\n`;
      }
    }
    md += '\n';
  } else {
    md += `${indent}${obj}\n`;
  }
  
  return md;
};

// Export individual parsers for direct access
export { xmlParser, jsonParser, markdownParser };
