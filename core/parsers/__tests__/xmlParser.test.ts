import { describe, it, expect } from 'vitest';
import {
  parseXml,
  formatXml,
  minifyXml,
  sortXml,
  xmlToJson,
  xmlToMarkdown,
  xmlToTree,
} from '../xmlParser';
import type { TreeNode } from '../../types';

describe('xmlParser', () => {
  describe('parseXml', () => {
    it('should parse valid XML', () => {
      const xml = '<root><child>text</child></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
      expect(result.data).toBe(xml);
    });

    it('should detect invalid XML', () => {
      const xml = '<root><child>text</root>';
      const result = parseXml(xml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mismatched tags');
    });

    it('should handle self-closing tags', () => {
      const xml = '<root><child /></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should handle attributes', () => {
      const xml = '<root attr="value"><child id="1">text</child></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should handle CDATA sections', () => {
      const xml = '<root><![CDATA[<special>content</special>]]></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should handle comments', () => {
      const xml = '<root><!-- comment --><child>text</child></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should handle XML declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should detect unclosed tags', () => {
      const xml = '<root><child>';
      const result = parseXml(xml);
      expect(result.success).toBe(false);
    });

    it('should handle nested elements', () => {
      const xml = '<root><a><b><c>deep</c></b></a></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });

    it('should handle empty elements', () => {
      const xml = '<root><empty></empty></root>';
      const result = parseXml(xml);
      expect(result.success).toBe(true);
    });
  });

  describe('formatXml', () => {
    it('should format minified XML with default indentation', () => {
      const xml = '<root><child>text</child></root>';
      const result = formatXml(xml);
      expect(result).toContain('\n');
      expect(result).toContain('  '); // 2 spaces default
    });

    it('should format with custom indentation', () => {
      const xml = '<root><child>text</child></root>';
      const result = formatXml(xml, { indent: 4 });
      expect(result).toContain('    '); // 4 spaces
    });

    it('should preserve CDATA sections', () => {
      const xml = '<root><![CDATA[content]]></root>';
      const result = formatXml(xml);
      expect(result).toContain('CDATA');
      expect(result).toContain('content');
    });

    it('should preserve comments', () => {
      const xml = '<root><!-- comment --><child>text</child></root>';
      const result = formatXml(xml);
      expect(result).toContain('<!-- comment -->');
    });

    it('should preserve XML declaration', () => {
      const xml = '<?xml version="1.0"?><root></root>';
      const result = formatXml(xml);
      expect(result).toContain('<?xml');
    });

    it('should handle attributes formatting', () => {
      const xml = '<root attr1="val1" attr2="val2"></root>';
      const result = formatXml(xml);
      expect(result).toContain('attr1="val1"');
      expect(result).toContain('attr2="val2"');
    });

    it('should handle nested elements', () => {
      const xml = '<root><a><b><c>text</c></b></a></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(4);
    });

    it('should preserve text content', () => {
      const xml = '<root><child>important text</child></root>';
      const result = formatXml(xml);
      expect(result).toContain('important text');
    });
  });

  describe('minifyXml', () => {
    it('should remove all whitespace', () => {
      const xml = `<root>
        <child>text</child>
      </root>`;
      const result = minifyXml(xml);
      expect(result).toBe('<root><child>text</child></root>');
    });

    it('should preserve text content whitespace', () => {
      const xml = '<root><child>text with spaces</child></root>';
      const result = minifyXml(xml);
      expect(result).toContain('text with spaces');
    });

    it('should preserve CDATA sections', () => {
      const xml = '<root><![CDATA[  spaced  ]]></root>';
      const result = minifyXml(xml);
      expect(result).toContain('  spaced  ');
    });

    it('should handle self-closing tags', () => {
      const xml = '<root>\n  <child />\n</root>';
      const result = minifyXml(xml);
      expect(result).toBe('<root><child /></root>');
    });
  });

  describe('sortXml', () => {
    it('should sort child elements alphabetically', () => {
      const xml = '<root><z>1</z><a>2</a><m>3</m></root>';
      const result = sortXml(xml);
      const formatted = formatXml(result);
      const lines = formatted.split('\n').filter(l => l.trim());
      
      const aIndex = lines.findIndex(l => l.includes('<a>'));
      const mIndex = lines.findIndex(l => l.includes('<m>'));
      const zIndex = lines.findIndex(l => l.includes('<z>'));
      
      expect(aIndex).toBeLessThan(mIndex);
      expect(mIndex).toBeLessThan(zIndex);
    });

    it('should sort attributes alphabetically', () => {
      const xml = '<root z="1" a="2" m="3"></root>';
      const result = sortXml(xml);
      expect(result.indexOf('a=')).toBeLessThan(result.indexOf('m='));
      expect(result.indexOf('m=')).toBeLessThan(result.indexOf('z='));
    });

    it('should handle nested sorting', () => {
      const xml = '<root><z><c>1</c><a>2</a></z><a>3</a></root>';
      const result = sortXml(xml);
      expect(result).toBeTruthy();
      // Verify that nested elements are also sorted
      const formatted = formatXml(result);
      expect(formatted).toContain('<a>');
      expect(formatted).toContain('<z>');
    });

    it('should preserve text content', () => {
      const xml = '<root><b>text1</b><a>text2</a></root>';
      const result = sortXml(xml);
      expect(result).toContain('text1');
      expect(result).toContain('text2');
    });
  });

  describe('xmlToJson', () => {
    it('should convert simple XML to JSON', () => {
      const xml = '<root><name>John</name><age>30</age></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(json.root).toBeDefined();
      expect(json.root.name).toBe('John');
      expect(json.root.age).toBe('30');
    });

    it('should handle attributes', () => {
      const xml = '<root id="1"><name>John</name></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(json.root['@id']).toBe('1');
      expect(json.root.name).toBe('John');
    });

    it('should handle arrays of elements', () => {
      const xml = '<root><item>1</item><item>2</item><item>3</item></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(Array.isArray(json.root.item)).toBe(true);
      expect(json.root.item.length).toBe(3);
    });

    it('should handle nested objects', () => {
      const xml = '<root><person><name>John</name></person></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(json.root.person.name).toBe('John');
    });

    it('should handle empty elements', () => {
      const xml = '<root><empty></empty></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(json.root.empty).toBeDefined();
    });

    it('should preserve number-like strings', () => {
      const xml = '<root><number>42</number></root>';
      const result = xmlToJson(xml);
      const json = JSON.parse(result);
      expect(json.root.number).toBe('42');
    });
  });

  describe('xmlToMarkdown', () => {
    it('should convert simple XML to Markdown', () => {
      const xml = '<root><title>Hello</title><content>World</content></root>';
      const result = xmlToMarkdown(xml);
      expect(result).toContain('# root');
      expect(result).toContain('title: Hello');
      expect(result).toContain('content: World');
    });

    it('should handle nested elements', () => {
      const xml = '<root><section><title>Test</title></section></root>';
      const result = xmlToMarkdown(xml);
      expect(result).toContain('# root');
      expect(result).toContain('## section');
      expect(result).toContain('title: Test');
    });

    it('should handle attributes', () => {
      const xml = '<root id="main"><item type="test">value</item></root>';
      const result = xmlToMarkdown(xml);
      expect(result).toContain('(id: main)');
      expect(result).toContain('(type: test)');
    });

    it('should create proper hierarchy', () => {
      const xml = '<root><h1>Title</h1><h2>Subtitle</h2></root>';
      const result = xmlToMarkdown(xml);
      const lines = result.split('\n');
      expect(lines.some(l => l.startsWith('#'))).toBe(true);
    });
  });

  describe('xmlToTree', () => {
    it('should convert XML to tree structure', () => {
      const xml = '<root><child>text</child></root>';
      const result = xmlToTree(xml);
      expect(result.name).toBe('root');
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('child');
      expect(result.children![0].value).toBe('text');
    });

    it('should handle attributes', () => {
      const xml = '<root id="1"><child>text</child></root>';
      const result = xmlToTree(xml);
      expect(result.attributes).toEqual({ id: '1' });
    });

    it('should handle multiple children', () => {
      const xml = '<root><a>1</a><b>2</b><c>3</c></root>';
      const result = xmlToTree(xml);
      expect(result.children).toHaveLength(3);
      expect(result.children![0].name).toBe('a');
      expect(result.children![1].name).toBe('b');
      expect(result.children![2].name).toBe('c');
    });

    it('should handle nested structures', () => {
      const xml = '<root><parent><child>text</child></parent></root>';
      const result = xmlToTree(xml);
      expect(result.children![0].name).toBe('parent');
      expect(result.children![0].children![0].name).toBe('child');
    });

    it('should handle self-closing tags', () => {
      const xml = '<root><empty /></root>';
      const result = xmlToTree(xml);
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('empty');
    });

    it('should preserve node types', () => {
      const xml = '<root><child>text</child></root>';
      const result = xmlToTree(xml);
      expect(result.type).toBe('element');
      expect(result.children![0].type).toBe('element');
    });
  });
});
