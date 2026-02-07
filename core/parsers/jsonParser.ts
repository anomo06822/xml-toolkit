// ============================================
// JSON Parser - Core JSON Processing Functions
// ============================================

import { TreeNode, OperationResult, FormatOptions, SortOptions } from '../types';

const looksLikeJsonContainer = (value: string): boolean => {
  const trimmed = value.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

const looksLikeEscapedJson = (value: string): boolean => {
  if (!looksLikeJsonContainer(value)) return false;
  return /\\[nrt"\\]/.test(value) || /\\u[0-9a-fA-F]{4}/.test(value);
};

const tryParseJsonValue = (value: string): OperationResult<any> => {
  try {
    const data = JSON.parse(value);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

const tryParseEmbeddedJson = (value: any): OperationResult<any> => {
  if (typeof value !== 'string') {
    return { success: false, error: 'Not a JSON string' };
  }
  if (!looksLikeJsonContainer(value)) {
    return { success: false, error: 'String does not look like JSON' };
  }
  return tryParseJsonValue(value.trim());
};

const tryUnescapeJsonString = (value: string): OperationResult<string> => {
  try {
    const unescaped = JSON.parse(`"${value}"`);
    return { success: true, data: unescaped };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Parse JSON string
export const parseJson = (jsonStr: string): OperationResult<any> => {
  const trimmed = jsonStr.trim();
  const direct = tryParseJsonValue(trimmed);
  if (direct.success) {
    const embedded = tryParseEmbeddedJson(direct.data);
    return embedded.success ? embedded : direct;
  }

  if (looksLikeEscapedJson(trimmed)) {
    const unescaped = tryUnescapeJsonString(trimmed);
    if (unescaped.success) {
      const parsed = tryParseJsonValue(unescaped.data);
      if (parsed.success) {
        const embedded = tryParseEmbeddedJson(parsed.data);
        return embedded.success ? embedded : parsed;
      }
    }
  }

  return direct;
};

// Serialize object to JSON string
export const serializeJson = (obj: any, pretty = true): string => {
  return JSON.stringify(obj, null, pretty ? 2 : 0);
};

// Format/Pretty print JSON
export const formatJson = (jsonStr: string, options: Partial<FormatOptions> = {}): OperationResult<string> => {
  const { indentSize = 2 } = options;
  
  const parsed = parseJson(jsonStr);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  const formatted = JSON.stringify(parsed.data, null, indentSize);
  return { success: true, data: formatted };
};

// Minify JSON
export const minifyJson = (jsonStr: string): OperationResult<string> => {
  const parsed = parseJson(jsonStr);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  const minified = JSON.stringify(parsed.data);
  return { success: true, data: minified };
};

// Sort JSON keys
export const sortJson = (jsonStr: string, options: Partial<SortOptions> = {}): OperationResult<string> => {
  const { direction = 'asc', recursive = true, caseSensitive = false } = options;
  
  const parsed = parseJson(jsonStr);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

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
  
  const sorted = sortObject(parsed.data);
  return { success: true, data: JSON.stringify(sorted, null, 2) };
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
export const jsonToXml = (
  jsonStr: string,
  rootName = 'root',
  arrayItemName = 'item'
): OperationResult<string> => {
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
      const textValue = value['#text'];
      const children = Object.entries(value)
        .filter(([key]) => !key.startsWith('@') && key !== '#text')
        .map(([key, val]) => valueToXml(val, key, indent + '  '))
        .join('');
      
      // Handle attributes
      const attrs = value['@attributes'];
      let attrStr = '';
      if (attrs && typeof attrs === 'object') {
        attrStr = Object.entries(attrs)
          .map(([key, val]) => ` ${key}="${escapeXml(String(val))}"`)
          .join('');
      }
      
      const textContent = textValue !== undefined && textValue !== null
        ? escapeXml(String(textValue))
        : '';
      
      if (!children.trim()) {
        if (textContent) {
          return `${indent}<${tagName}${attrStr}>${textContent}</${tagName}>\n`;
        }
        return `${indent}<${tagName}${attrStr}/>\n`;
      }
      
      const textLine = textContent ? `${indent}  ${textContent}\n` : '';
      return `${indent}<${tagName}${attrStr}>\n${textLine}${children}${indent}</${tagName}>\n`;
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
  if (Array.isArray(data)) {
    const children = data
      .map(item => valueToXml(item, arrayItemName, '  '))
      .join('');
    xml += `<${rootName}>\n${children}</${rootName}>`;
  } else if (typeof data === 'object' && data !== null) {
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
