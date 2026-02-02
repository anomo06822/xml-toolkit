// ============================================
// Markdown Parser - Core Markdown Processing Functions
// ============================================

import { TreeNode, OperationResult, FormatOptions, SortOptions } from '../types';

// Markdown token types
interface MarkdownToken {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'blockquote' | 'hr' | 'table' | 'blank';
  level?: number;
  content: string;
  language?: string;
  items?: string[];
  raw: string;
}

// Parse markdown into tokens
export const parseMarkdown = (mdStr: string): OperationResult<MarkdownToken[]> => {
  try {
    const lines = mdStr.split('\n');
    const tokens: MarkdownToken[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        tokens.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2],
          raw: line
        });
        i++;
        continue;
      }
      
      // Code block
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        tokens.push({
          type: 'code',
          content: codeLines.join('\n'),
          language,
          raw: '```' + language + '\n' + codeLines.join('\n') + '\n```'
        });
        i++; // Skip closing ```
        continue;
      }
      
      // Horizontal rule
      if (/^[-*_]{3,}$/.test(line.trim())) {
        tokens.push({
          type: 'hr',
          content: '',
          raw: line
        });
        i++;
        continue;
      }
      
      // Unordered list
      if (/^[-*+]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*+]\s+/, ''));
          i++;
        }
        tokens.push({
          type: 'list',
          content: items.join('\n'),
          items,
          raw: items.map(item => `- ${item}`).join('\n')
        });
        continue;
      }
      
      // Ordered list
      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        tokens.push({
          type: 'list',
          content: items.join('\n'),
          items,
          raw: items.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
        });
        continue;
      }
      
      // Blockquote
      if (line.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        tokens.push({
          type: 'blockquote',
          content: quoteLines.join('\n'),
          raw: quoteLines.map(l => `> ${l}`).join('\n')
        });
        continue;
      }
      
      // Blank line
      if (!line.trim()) {
        tokens.push({
          type: 'blank',
          content: '',
          raw: ''
        });
        i++;
        continue;
      }
      
      // Paragraph (default)
      const paragraphLines: string[] = [line];
      i++;
      while (i < lines.length && 
             lines[i].trim() && 
             !lines[i].startsWith('#') && 
             !lines[i].startsWith('```') &&
             !lines[i].startsWith('>') &&
             !/^[-*+]\s+/.test(lines[i]) &&
             !/^\d+\.\s+/.test(lines[i]) &&
             !/^[-*_]{3,}$/.test(lines[i].trim())) {
        paragraphLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: 'paragraph',
        content: paragraphLines.join('\n'),
        raw: paragraphLines.join('\n')
      });
    }
    
    return { success: true, data: tokens };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Serialize tokens back to markdown
export const serializeMarkdown = (tokens: MarkdownToken[]): string => {
  return tokens.map(token => token.raw).join('\n');
};

// Format markdown
export const formatMarkdown = (mdStr: string, options: Partial<FormatOptions> = {}): OperationResult<string> => {
  const parseResult = parseMarkdown(mdStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  // Normalize formatting
  const formatted = parseResult.data
    .filter(token => token.type !== 'blank') // Remove excessive blank lines
    .map(token => {
      switch (token.type) {
        case 'heading':
          return `${'#'.repeat(token.level || 1)} ${token.content}`;
        case 'code':
          return `\`\`\`${token.language || ''}\n${token.content}\n\`\`\``;
        case 'list':
          return (token.items || []).map(item => `- ${item}`).join('\n');
        case 'blockquote':
          return token.content.split('\n').map(line => `> ${line}`).join('\n');
        case 'hr':
          return '---';
        default:
          return token.content;
      }
    })
    .join('\n\n'); // Add consistent spacing between blocks
  
  return { success: true, data: formatted };
};

// Minify markdown (remove extra whitespace)
export const minifyMarkdown = (mdStr: string): OperationResult<string> => {
  try {
    const minified = mdStr
      .replace(/\n{3,}/g, '\n\n') // Multiple blank lines to single
      .replace(/[ \t]+$/gm, '')   // Trailing whitespace
      .trim();
    return { success: true, data: minified };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// Sort markdown sections (by heading)
export const sortMarkdown = (mdStr: string, options: Partial<SortOptions> = {}): OperationResult<string> => {
  const { direction = 'asc' } = options;
  
  const parseResult = parseMarkdown(mdStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  // Group tokens by top-level headings
  const sections: { heading: string; tokens: MarkdownToken[] }[] = [];
  let currentSection: { heading: string; tokens: MarkdownToken[] } | null = null;
  let preamble: MarkdownToken[] = [];
  
  for (const token of parseResult.data) {
    if (token.type === 'heading' && token.level === 1) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { heading: token.content, tokens: [token] };
    } else if (currentSection) {
      currentSection.tokens.push(token);
    } else {
      preamble.push(token);
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Sort sections
  sections.sort((a, b) => {
    const comparison = a.heading.localeCompare(b.heading);
    return direction === 'desc' ? -comparison : comparison;
  });
  
  // Reconstruct markdown
  const allTokens = [...preamble, ...sections.flatMap(s => s.tokens)];
  const result = serializeMarkdown(allTokens);
  
  return formatMarkdown(result);
};

// Convert markdown to TreeNode for visualization
export const markdownToTree = (mdStr: string): OperationResult<TreeNode> => {
  const parseResult = parseMarkdown(mdStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  let nodeId = 0;
  
  const tokenToNode = (token: MarkdownToken): TreeNode => {
    const baseNode: TreeNode = {
      id: `node-${nodeId++}`,
      type: token.type as any,
      name: token.type,
      value: token.content.substring(0, 100) + (token.content.length > 100 ? '...' : ''),
      children: [],
      sourceFormat: 'markdown'
    };
    
    if (token.type === 'heading') {
      baseNode.name = `h${token.level}`;
      baseNode.value = token.content;
    }
    
    if (token.type === 'code') {
      baseNode.name = `code (${token.language || 'text'})`;
    }
    
    if (token.type === 'list' && token.items) {
      baseNode.children = token.items.map(item => ({
        id: `node-${nodeId++}`,
        type: 'text' as const,
        name: 'list-item',
        value: item,
        children: [],
        sourceFormat: 'markdown' as const
      }));
    }
    
    return baseNode;
  };
  
  const children = parseResult.data
    .filter(t => t.type !== 'blank')
    .map(tokenToNode);
  
  return {
    success: true,
    data: {
      id: 'root',
      type: 'element',
      name: 'document',
      children,
      sourceFormat: 'markdown'
    }
  };
};

// Convert markdown to JSON
export const markdownToJson = (mdStr: string): OperationResult<any> => {
  const parseResult = parseMarkdown(mdStr);
  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }
  
  const document: any = {
    type: 'document',
    children: []
  };
  
  for (const token of parseResult.data) {
    if (token.type === 'blank') continue;
    
    const node: any = { type: token.type };
    
    if (token.type === 'heading') {
      node.level = token.level;
      node.text = token.content;
    } else if (token.type === 'code') {
      node.language = token.language;
      node.code = token.content;
    } else if (token.type === 'list') {
      node.items = token.items;
    } else {
      node.text = token.content;
    }
    
    document.children.push(node);
  }
  
  return { success: true, data: document };
};

// Convert markdown to XML
export const markdownToXml = (mdStr: string): OperationResult<string> => {
  const jsonResult = markdownToJson(mdStr);
  if (!jsonResult.success) {
    return { success: false, error: jsonResult.error };
  }
  
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<document>\n';
  
  for (const child of jsonResult.data.children) {
    switch (child.type) {
      case 'heading':
        xml += `  <heading level="${child.level}">${escapeXml(child.text)}</heading>\n`;
        break;
      case 'paragraph':
        xml += `  <paragraph>${escapeXml(child.text)}</paragraph>\n`;
        break;
      case 'code':
        xml += `  <code language="${child.language || ''}">\n    <![CDATA[${child.code}]]>\n  </code>\n`;
        break;
      case 'list':
        xml += '  <list>\n';
        for (const item of child.items) {
          xml += `    <item>${escapeXml(item)}</item>\n`;
        }
        xml += '  </list>\n';
        break;
      case 'blockquote':
        xml += `  <blockquote>${escapeXml(child.text)}</blockquote>\n`;
        break;
      case 'hr':
        xml += '  <hr/>\n';
        break;
    }
  }
  
  xml += '</document>';
  
  return { success: true, data: xml };
};

// Validate markdown (basic check)
export const validateMarkdown = (mdStr: string): OperationResult<boolean> => {
  const result = parseMarkdown(mdStr);
  return {
    success: result.success,
    data: result.success,
    error: result.error
  };
};
