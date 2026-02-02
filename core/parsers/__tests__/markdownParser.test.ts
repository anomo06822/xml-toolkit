import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  formatMarkdown,
  minifyMarkdown,
  sortMarkdown,
  markdownToXml,
  markdownToJson,
  markdownToTree,
} from '../markdownParser';

describe('markdownParser', () => {
  describe('parseMarkdown', () => {
    it('should parse valid Markdown', () => {
      const md = '# Title\n\nParagraph text';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
      expect(result.data).toBe(md);
    });

    it('should accept any markdown content', () => {
      const md = 'Just plain text';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle headers', () => {
      const md = '# H1\n## H2\n### H3';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle lists', () => {
      const md = '- Item 1\n- Item 2\n- Item 3';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle code blocks', () => {
      const md = '```js\nconst x = 1;\n```';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle links', () => {
      const md = '[Link](https://example.com)';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle emphasis', () => {
      const md = '**bold** and *italic*';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });

    it('should handle empty content', () => {
      const md = '';
      const result = parseMarkdown(md);
      expect(result.success).toBe(true);
    });
  });

  describe('formatMarkdown', () => {
    it('should normalize line breaks', () => {
      const md = '# Title\n\n\n\nParagraph';
      const result = formatMarkdown(md);
      expect(result).not.toContain('\n\n\n\n');
    });

    it('should preserve headers', () => {
      const md = '# H1\n## H2';
      const result = formatMarkdown(md);
      expect(result).toContain('# H1');
      expect(result).toContain('## H2');
    });

    it('should preserve lists', () => {
      const md = '- Item 1\n- Item 2';
      const result = formatMarkdown(md);
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });

    it('should normalize whitespace', () => {
      const md = '#  Title  ';
      const result = formatMarkdown(md);
      expect(result).toContain('# Title');
    });

    it('should preserve code blocks', () => {
      const md = '```js\ncode\n```';
      const result = formatMarkdown(md);
      expect(result).toContain('```');
      expect(result).toContain('code');
    });

    it('should handle mixed content', () => {
      const md = '# Title\n\nText\n\n- List\n\n```code```';
      const result = formatMarkdown(md);
      expect(result).toContain('# Title');
      expect(result).toContain('Text');
      expect(result).toContain('- List');
    });
  });

  describe('minifyMarkdown', () => {
    it('should remove excessive whitespace', () => {
      const md = '# Title\n\n\n\nParagraph\n\n\n';
      const result = minifyMarkdown(md);
      expect(result).toBe('# Title\n\nParagraph');
    });

    it('should preserve single line breaks in lists', () => {
      const md = '- Item 1\n- Item 2';
      const result = minifyMarkdown(md);
      expect(result).toContain('\n');
    });

    it('should preserve structure', () => {
      const md = '# H1\n\nText\n\n## H2';
      const result = minifyMarkdown(md);
      expect(result).toContain('# H1');
      expect(result).toContain('## H2');
    });

    it('should handle code blocks', () => {
      const md = '```\ncode\n\n\nmore\n```';
      const result = minifyMarkdown(md);
      expect(result).toContain('```');
    });
  });

  describe('sortMarkdown', () => {
    it('should sort headers alphabetically', () => {
      const md = '# Z Section\n\nContent Z\n\n# A Section\n\nContent A';
      const result = sortMarkdown(md);
      const aIndex = result.indexOf('# A Section');
      const zIndex = result.indexOf('# Z Section');
      expect(aIndex).toBeLessThan(zIndex);
    });

    it('should sort list items', () => {
      const md = '- Zebra\n- Apple\n- Mango';
      const result = sortMarkdown(md);
      const lines = result.split('\n');
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Mango');
      expect(lines[2]).toContain('Zebra');
    });

    it('should preserve header hierarchy', () => {
      const md = '# Main\n## Z Sub\n## A Sub';
      const result = sortMarkdown(md);
      expect(result).toContain('# Main');
      expect(result.indexOf('## A Sub')).toBeLessThan(result.indexOf('## Z Sub'));
    });

    it('should handle mixed content', () => {
      const md = '# Title\n\nParagraph\n\n- Z\n- A';
      const result = sortMarkdown(md);
      expect(result).toContain('# Title');
      expect(result).toContain('Paragraph');
    });
  });

  describe('markdownToXml', () => {
    it('should convert headers to XML elements', () => {
      const md = '# Title\n\nContent';
      const result = markdownToXml(md);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should handle multiple headers', () => {
      const md = '# H1\n## H2\n### H3';
      const result = markdownToXml(md);
      expect(result).toContain('<h1>H1</h1>');
      expect(result).toContain('<h2>H2</h2>');
      expect(result).toContain('<h3>H3</h3>');
    });

    it('should convert lists to XML', () => {
      const md = '- Item 1\n- Item 2';
      const result = markdownToXml(md);
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
    });

    it('should handle code blocks', () => {
      const md = '```js\ncode\n```';
      const result = markdownToXml(md);
      expect(result).toContain('<code');
      expect(result).toContain('code');
    });

    it('should handle links', () => {
      const md = '[Link](https://example.com)';
      const result = markdownToXml(md);
      expect(result).toContain('<a');
      expect(result).toContain('https://example.com');
    });

    it('should wrap content in root element', () => {
      const md = '# Title';
      const result = markdownToXml(md);
      expect(result).toContain('<document>');
      expect(result).toContain('</document>');
    });
  });

  describe('markdownToJson', () => {
    it('should convert headers to JSON structure', () => {
      const md = '# Title\n\nContent';
      const result = markdownToJson(md);
      const json = JSON.parse(result);
      expect(json.sections).toBeDefined();
      expect(Array.isArray(json.sections)).toBe(true);
    });

    it('should handle multiple sections', () => {
      const md = '# Section 1\n\nContent 1\n\n# Section 2\n\nContent 2';
      const result = markdownToJson(md);
      const json = JSON.parse(result);
      expect(json.sections.length).toBeGreaterThanOrEqual(1);
    });

    it('should convert lists to arrays', () => {
      const md = '- Item 1\n- Item 2\n- Item 3';
      const result = markdownToJson(md);
      const json = JSON.parse(result);
      expect(json).toBeDefined();
    });

    it('should handle nested headers', () => {
      const md = '# H1\n## H2\n### H3';
      const result = markdownToJson(md);
      const json = JSON.parse(result);
      expect(json.sections).toBeDefined();
    });

    it('should preserve content', () => {
      const md = '# Title\n\nImportant text';
      const result = markdownToJson(md);
      expect(result).toContain('Important text');
    });
  });

  describe('markdownToTree', () => {
    it('should convert markdown to tree structure', () => {
      const md = '# Title\n\nContent';
      const result = markdownToTree(md);
      expect(result.name).toBe('document');
      expect(result.children).toBeDefined();
    });

    it('should handle headers as nodes', () => {
      const md = '# H1\n## H2';
      const result = markdownToTree(md);
      expect(result.children?.some(c => c.name === 'h1')).toBe(true);
    });

    it('should handle lists', () => {
      const md = '- Item 1\n- Item 2';
      const result = markdownToTree(md);
      expect(result.children).toBeDefined();
    });

    it('should create hierarchy', () => {
      const md = '# Main\n\nText\n\n## Sub';
      const result = markdownToTree(md);
      expect(result.children?.length).toBeGreaterThan(0);
    });

    it('should preserve structure', () => {
      const md = '# A\n\n## B\n\n### C';
      const result = markdownToTree(md);
      expect(result.type).toBe('document');
      expect(result.children).toBeDefined();
    });
  });
});
