// ============================================
// XML Parser - Core XML Processing Functions
// ============================================

import { TreeNode, OperationResult, FormatOptions, SortOptions } from '../types';

// Parse XML string to DOM Document
export const parseXml = (xmlStr: string): OperationResult<Document> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'text/xml');
    const parserError = doc.getElementsByTagName('parsererror');
    
    if (parserError.length > 0) {
      return {
        success: false,
        error: parserError[0].textContent || 'Error parsing XML'
      };
    }
    
    return { success: true, data: doc };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Serialize DOM to XML string
export const serializeXml = (node: Node): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(node);
};

// Format/Pretty print XML
export const formatXml = (xml: string, options: Partial<FormatOptions> = {}): OperationResult<string> => {
  const { indentSize = 2, indentChar = 'space' } = options;
  const indent = indentChar === 'tab' ? '\t' : ' '.repeat(indentSize);
  
  try {
    // First minify to normalize
    const minified = minifyXml(xml);
    if (!minified.success || !minified.data) {
      return minified;
    }
    
    let formatted = '';
    let indentLevel = 0;
    const nodes = minified.data.match(/<[^>]+>|[^<]+/g) || [];
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      if (node.startsWith('</')) {
        // Closing tag
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += indent.repeat(indentLevel) + node + '\n';
        continue;
      }
      
      if (node.startsWith('<?')) {
        // XML declaration
        formatted += node + '\n';
        continue;
      }
      
      if (node.startsWith('<!')) {
        // DOCTYPE, Comment, CDATA
        formatted += indent.repeat(indentLevel) + node + '\n';
        continue;
      }
      
      if (node.startsWith('<') && node.endsWith('/>')) {
        // Self-closing tag
        formatted += indent.repeat(indentLevel) + node + '\n';
        continue;
      }
      
      if (node.startsWith('<')) {
        // Opening tag
        const next = nodes[i + 1];
        const nextNext = nodes[i + 2];
        const hasInlineText = next && !next.startsWith('<') && next.trim() && nextNext && nextNext.startsWith('</');
        
        if (hasInlineText) {
          formatted += indent.repeat(indentLevel) + node + next.trim() + nextNext + '\n';
          i += 2;
        } else {
          formatted += indent.repeat(indentLevel) + node + '\n';
          indentLevel++;
        }
        continue;
      }
      
      if (node.trim()) {
        // Text content
        formatted += indent.repeat(indentLevel) + node.trim() + '\n';
      }
    }
    
    // Clean up result
    let result = formatted.trim();
    // Fix over-indented text nodes
    result = result.replace(/(<[^/>]+>)\n\s+([^<]+)\n\s+(<\/)/g, '$1$2$3');
    
    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Minify XML (remove whitespace)
export const minifyXml = (xmlStr: string): OperationResult<string> => {
  try {
    // Pre-process: replace escaped characters
    const cleaned = xmlStr
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"');
    
    const parseResult = parseXml(cleaned);
    if (!parseResult.success || !parseResult.data) {
      // Fallback to regex if DOM parsing fails
      const fallback = cleaned.replace(/>\s+</g, '><').trim();
      return { success: true, data: fallback, warnings: ['Used regex fallback for minification'] };
    }
    
    // Remove whitespace-only text nodes
    const removeWhitespace = (node: Node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!child.nodeValue?.trim()) {
            node.removeChild(child);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          removeWhitespace(child);
        }
      }
    };
    
    removeWhitespace(parseResult.data.documentElement);
    return { success: true, data: serializeXml(parseResult.data) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Sort XML nodes alphabetically
export const sortXml = (xmlStr: string, options: Partial<SortOptions> = {}): OperationResult<string> => {
  const { direction = 'asc', recursive = true, caseSensitive = false } = options;
  
  const parseResult = parseXml(xmlStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  const sortNodes = (element: Element) => {
    const children = Array.from(element.children);
    
    children.sort((a, b) => {
      let aName = a.tagName;
      let bName = b.tagName;
      
      if (!caseSensitive) {
        aName = aName.toLowerCase();
        bName = bName.toLowerCase();
      }
      
      const comparison = aName.localeCompare(bName);
      return direction === 'desc' ? -comparison : comparison;
    });
    
    // Re-append in sorted order
    children.forEach(child => element.appendChild(child));
    
    // Recursively sort children
    if (recursive) {
      children.forEach(child => sortNodes(child));
    }
  };
  
  sortNodes(parseResult.data.documentElement);
  
  // Format the result
  const serialized = serializeXml(parseResult.data);
  return formatXml(serialized);
};

// Convert XML to TreeNode for visualization
export const xmlToTree = (xmlStr: string): OperationResult<TreeNode> => {
  const parseResult = parseXml(xmlStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  let nodeId = 0;
  
  const elementToNode = (element: Element): TreeNode => {
    const children: TreeNode[] = [];
    
    // Add attributes as children
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      children.push({
        id: `node-${nodeId++}`,
        type: 'attribute',
        name: attr.name,
        value: attr.value,
        children: [],
        sourceFormat: 'xml'
      });
    }
    
    // Add child elements and text
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(elementToNode(child as Element));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue?.trim();
        if (text) {
          children.push({
            id: `node-${nodeId++}`,
            type: 'text',
            name: '#text',
            value: text,
            children: [],
            sourceFormat: 'xml'
          });
        }
      }
    }
    
    return {
      id: `node-${nodeId++}`,
      type: 'element',
      name: element.tagName,
      children,
      sourceFormat: 'xml'
    };
  };
  
  return { success: true, data: elementToNode(parseResult.data.documentElement) };
};

// Convert XML to JSON object
export const xmlToJson = (xmlStr: string): OperationResult<any> => {
  const parseResult = parseXml(xmlStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  const elementToJson = (element: Element): any => {
    const obj: any = {};
    
    // Handle attributes
    if (element.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }
    
    // Handle children
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue?.trim();
        if (text) {
          if (Object.keys(obj).length === 0) {
            return text; // Only text content
          }
          obj['#text'] = text;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as Element;
        const childName = childElement.tagName;
        const childValue = elementToJson(childElement);
        
        if (obj[childName] !== undefined) {
          // Convert to array if multiple children with same name
          if (!Array.isArray(obj[childName])) {
            obj[childName] = [obj[childName]];
          }
          obj[childName].push(childValue);
        } else {
          obj[childName] = childValue;
        }
      }
    }
    
    return obj;
  };
  
  const rootElement = parseResult.data.documentElement;
  const result = {
    [rootElement.tagName]: elementToJson(rootElement)
  };
  
  return { success: true, data: result };
};

// Validate XML
export const validateXml = (xmlStr: string): OperationResult<boolean> => {
  const result = parseXml(xmlStr);
  return {
    success: result.success,
    data: result.success,
    error: result.error
  };
};
