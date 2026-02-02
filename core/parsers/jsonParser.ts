// ============================================
// JSON Parser - Core JSON Processing Functions
// ============================================

import { TreeNode, OperationResult, FormatOptions, SortOptions } from '../types';

// Parse JSON string
export const parseJson = (jsonStr: string): OperationResult<any> => {
  try {
    const data = JSON.parse(jsonStr);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Serialize object to JSON string
export const serializeJson = (obj: any, pretty = true): string => {
  return JSON.stringify(obj, null, pretty ? 2 : 0);
};

// Format/Pretty print JSON
export const formatJson = (jsonStr: string, options: Partial<FormatOptions> = {}): OperationResult<string> => {
  const { indentSize = 2 } = options;
  
  try {
    const parsed = JSON.parse(jsonStr);
    const formatted = JSON.stringify(parsed, null, indentSize);
    return { success: true, data: formatted };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Minify JSON
export const minifyJson = (jsonStr: string): OperationResult<string> => {
  try {
    const parsed = JSON.parse(jsonStr);
    const minified = JSON.stringify(parsed);
    return { success: true, data: minified };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Sort JSON keys
export const sortJson = (jsonStr: string, options: Partial<SortOptions> = {}): OperationResult<string> => {
  const { direction = 'asc', recursive = true, caseSensitive = false } = options;
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    const sortObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => recursive ? sortObject(item) : item);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const keys = Object.keys(obj);
        
        keys.sort((a, b) => {
          let aKey = caseSensitive ? a : a.toLowerCase();
          let bKey = caseSensitive ? b : b.toLowerCase();
          const comparison = aKey.localeCompare(bKey);
          return direction === 'desc' ? -comparison : comparison;
        });
        
        const sorted: any = {};
        for (const key of keys) {
          sorted[key] = recursive ? sortObject(obj[key]) : obj[key];
        }
        return sorted;
      }
      
      return obj;
    };
    
    const sorted = sortObject(parsed);
    return { success: true, data: JSON.stringify(sorted, null, 2) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Convert JSON to TreeNode for visualization
export const jsonToTree = (jsonStr: string): OperationResult<TreeNode> => {
  const parseResult = parseJson(jsonStr);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }
  
  let nodeId = 0;
  
  const valueToNode = (value: any, name: string): TreeNode => {
    if (value === null) {
      return {
        id: `node-${nodeId++}`,
        type: 'value',
        name,
        value: 'null',
        children: [],
        sourceFormat: 'json'
      };
    }
    
    if (Array.isArray(value)) {
      return {
        id: `node-${nodeId++}`,
        type: 'array',
        name,
        value: `[${value.length} items]`,
        children: value.map((item, index) => valueToNode(item, `[${index}]`)),
        sourceFormat: 'json'
      };
    }
    
    if (typeof value === 'object') {
      return {
        id: `node-${nodeId++}`,
        type: 'object',
        name,
        children: Object.entries(value).map(([key, val]) => valueToNode(val, key)),
        sourceFormat: 'json'
      };
    }
    
    return {
      id: `node-${nodeId++}`,
      type: 'value',
      name,
      value: String(value),
      children: [],
      sourceFormat: 'json'
    };
  };
  
  const root = valueToNode(parseResult.data, 'root');
  return { success: true, data: root };
};

// Convert JSON to XML
export const jsonToXml = (jsonStr: string, rootName = 'root'): OperationResult<string> => {
  const parseResult = parseJson(jsonStr);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }
  
  const valueToXml = (value: any, tagName: string, indent = ''): string => {
    if (value === null || value === undefined) {
      return `${indent}<${tagName}/>\n`;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => valueToXml(item, tagName, indent)).join('');
    }
    
    if (typeof value === 'object') {
      const children = Object.entries(value)
        .filter(([key]) => !key.startsWith('@'))
        .map(([key, val]) => valueToXml(val, key, indent + '  '))
        .join('');
      
      // Handle attributes
      const attrs = value['@attributes'];
      let attrStr = '';
      if (attrs && typeof attrs === 'object') {
        attrStr = Object.entries(attrs)
          .map(([key, val]) => ` ${key}="${val}"`)
          .join('');
      }
      
      if (!children.trim()) {
        return `${indent}<${tagName}${attrStr}/>\n`;
      }
      
      return `${indent}<${tagName}${attrStr}>\n${children}${indent}</${tagName}>\n`;
    }
    
    return `${indent}<${tagName}>${escapeXml(String(value))}</${tagName}>\n`;
  };
  
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const data = parseResult.data;
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  // If the data has a single root key, use it
  if (typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      xml += valueToXml(data[keys[0]], keys[0]);
    } else {
      xml += valueToXml(data, rootName);
    }
  } else {
    xml += valueToXml(data, rootName);
  }
  
  return { success: true, data: xml.trim() };
};

// Validate JSON
export const validateJson = (jsonStr: string): OperationResult<boolean> => {
  const result = parseJson(jsonStr);
  return {
    success: result.success,
    data: result.success,
    error: result.error
  };
};
