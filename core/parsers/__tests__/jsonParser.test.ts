import { describe, it, expect } from 'vitest';
import {
  parseJson,
  formatJson,
  minifyJson,
  sortJson,
  jsonToXml,
  jsonToMarkdown,
  jsonToTree,
} from '../jsonParser';

describe('jsonParser', () => {
  describe('parseJson', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "John", "age": 30}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should detect invalid JSON', () => {
      const json = '{"name": "John", age: 30}'; // Missing quotes on key
      const result = parseJson(json);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle arrays', () => {
      const json = '[1, 2, 3]';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle nested objects', () => {
      const json = '{"person": {"name": "John", "age": 30}}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('person');
    });

    it('should handle null values', () => {
      const json = '{"value": null}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: null });
    });

    it('should handle boolean values', () => {
      const json = '{"active": true, "disabled": false}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ active: true, disabled: false });
    });

    it('should handle numbers', () => {
      const json = '{"int": 42, "float": 3.14, "exp": 1e10}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
    });

    it('should handle empty objects', () => {
      const json = '{}';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle empty arrays', () => {
      const json = '[]';
      const result = parseJson(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('formatJson', () => {
    it('should format minified JSON with default indentation', () => {
      const json = '{"name":"John","age":30}';
      const result = formatJson(json);
      expect(result).toContain('\n');
      expect(result).toContain('  '); // 2 spaces default
    });

    it('should format with custom indentation', () => {
      const json = '{"name":"John"}';
      const result = formatJson(json, { indent: 4 });
      expect(result).toContain('    '); // 4 spaces
    });

    it('should handle nested objects', () => {
      const json = '{"person":{"name":"John","address":{"city":"NYC"}}}';
      const result = formatJson(json);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(5);
    });

    it('should format arrays', () => {
      const json = '[1,2,3]';
      const result = formatJson(json);
      expect(result).toContain('[\n');
      expect(result).toContain('\n]');
    });

    it('should preserve data types', () => {
      const json = '{"str":"text","num":42,"bool":true,"null":null}';
      const result = formatJson(json);
      expect(result).toContain('"text"');
      expect(result).toContain('42');
      expect(result).toContain('true');
      expect(result).toContain('null');
    });

    it('should handle mixed arrays', () => {
      const json = '[1,"text",true,null,{"key":"value"}]';
      const result = formatJson(json);
      expect(result).toContain('1');
      expect(result).toContain('"text"');
      expect(result).toContain('true');
    });
  });

  describe('minifyJson', () => {
    it('should remove all whitespace', () => {
      const json = `{
        "name": "John",
        "age": 30
      }`;
      const result = minifyJson(json);
      expect(result).toBe('{"name":"John","age":30}');
    });

    it('should preserve string content', () => {
      const json = '{"text": "has spaces"}';
      const result = minifyJson(json);
      expect(result).toContain('has spaces');
    });

    it('should handle arrays', () => {
      const json = '[\n  1,\n  2,\n  3\n]';
      const result = minifyJson(json);
      expect(result).toBe('[1,2,3]');
    });

    it('should handle nested structures', () => {
      const json = `{
        "person": {
          "name": "John"
        }
      }`;
      const result = minifyJson(json);
      expect(result).toBe('{"person":{"name":"John"}}');
    });
  });

  describe('sortJson', () => {
    it('should sort object keys alphabetically', () => {
      const json = '{"z": 1, "a": 2, "m": 3}';
      const result = sortJson(json);
      const parsed = JSON.parse(result);
      const keys = Object.keys(parsed);
      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('should handle nested object sorting', () => {
      const json = '{"z": {"c": 1, "a": 2}, "a": 3}';
      const result = sortJson(json);
      const parsed = JSON.parse(result);
      const topKeys = Object.keys(parsed);
      const nestedKeys = Object.keys(parsed.z);
      expect(topKeys).toEqual(['a', 'z']);
      expect(nestedKeys).toEqual(['a', 'c']);
    });

    it('should preserve array order', () => {
      const json = '{"items": [3, 1, 2]}';
      const result = sortJson(json);
      const parsed = JSON.parse(result);
      expect(parsed.items).toEqual([3, 1, 2]);
    });

    it('should handle arrays of objects', () => {
      const json = '{"items": [{"z": 1, "a": 2}, {"m": 3, "b": 4}]}';
      const result = sortJson(json);
      const parsed = JSON.parse(result);
      expect(Object.keys(parsed.items[0])).toEqual(['a', 'z']);
      expect(Object.keys(parsed.items[1])).toEqual(['b', 'm']);
    });

    it('should preserve data types', () => {
      const json = '{"z": null, "a": true, "m": 42}';
      const result = sortJson(json);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ a: true, m: 42, z: null });
    });
  });

  describe('jsonToXml', () => {
    it('should convert simple object to XML', () => {
      const json = '{"root": {"name": "John", "age": "30"}}';
      const result = jsonToXml(json);
      expect(result).toContain('<root>');
      expect(result).toContain('<name>John</name>');
      expect(result).toContain('<age>30</age>');
    });

    it('should handle nested objects', () => {
      const json = '{"root": {"person": {"name": "John"}}}';
      const result = jsonToXml(json);
      expect(result).toContain('<root>');
      expect(result).toContain('<person>');
      expect(result).toContain('<name>John</name>');
    });

    it('should handle arrays', () => {
      const json = '{"root": {"item": ["a", "b", "c"]}}';
      const result = jsonToXml(json);
      expect(result).toContain('<item>a</item>');
      expect(result).toContain('<item>b</item>');
      expect(result).toContain('<item>c</item>');
    });

    it('should handle attributes with @ prefix', () => {
      const json = '{"root": {"@id": "1", "name": "Test"}}';
      const result = jsonToXml(json);
      expect(result).toContain('id="1"');
      expect(result).toContain('<name>Test</name>');
    });

    it('should handle text content with #text key', () => {
      const json = '{"root": {"#text": "content", "@id": "1"}}';
      const result = jsonToXml(json);
      expect(result).toContain('id="1"');
      expect(result).toContain('>content<');
    });

    it('should handle empty objects', () => {
      const json = '{"root": {"empty": {}}}';
      const result = jsonToXml(json);
      expect(result).toContain('<empty');
    });
  });

  describe('jsonToMarkdown', () => {
    it('should convert simple object to Markdown', () => {
      const json = '{"title": "Hello", "content": "World"}';
      const result = jsonToMarkdown(json);
      expect(result).toContain('title: Hello');
      expect(result).toContain('content: World');
    });

    it('should handle nested objects', () => {
      const json = '{"person": {"name": "John", "age": 30}}';
      const result = jsonToMarkdown(json);
      expect(result).toContain('## person');
      expect(result).toContain('name: John');
      expect(result).toContain('age: 30');
    });

    it('should handle arrays as lists', () => {
      const json = '{"items": ["apple", "banana", "cherry"]}';
      const result = jsonToMarkdown(json);
      expect(result).toContain('- apple');
      expect(result).toContain('- banana');
      expect(result).toContain('- cherry');
    });

    it('should handle arrays of objects', () => {
      const json = '{"users": [{"name": "John"}, {"name": "Jane"}]}';
      const result = jsonToMarkdown(json);
      expect(result).toContain('name: John');
      expect(result).toContain('name: Jane');
    });

    it('should create proper hierarchy', () => {
      const json = '{"root": {"section": {"item": "value"}}}';
      const result = jsonToMarkdown(json);
      const lines = result.split('\n');
      const headers = lines.filter(l => l.startsWith('#'));
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('jsonToTree', () => {
    it('should convert object to tree structure', () => {
      const json = '{"root": {"child": "value"}}';
      const result = jsonToTree(json);
      expect(result.name).toBe('root');
      expect(result.children).toHaveLength(1);
      expect(result.children![0].name).toBe('child');
      expect(result.children![0].value).toBe('value');
    });

    it('should handle arrays', () => {
      const json = '{"items": [1, 2, 3]}';
      const result = jsonToTree(json);
      expect(result.children![0].name).toBe('items');
      expect(result.children![0].children).toHaveLength(3);
    });

    it('should handle nested objects', () => {
      const json = '{"root": {"parent": {"child": "value"}}}';
      const result = jsonToTree(json);
      expect(result.children![0].name).toBe('parent');
      expect(result.children![0].children![0].name).toBe('child');
    });

    it('should preserve data types', () => {
      const json = '{"num": 42, "bool": true, "null": null}';
      const result = jsonToTree(json);
      expect(result.children![0].value).toBe('42');
      expect(result.children![1].value).toBe('true');
      expect(result.children![2].value).toBe('null');
    });

    it('should handle complex structures', () => {
      const json = '{"root": {"items": [{"name": "a"}, {"name": "b"}]}}';
      const result = jsonToTree(json);
      expect(result.children).toBeDefined();
      expect(result.type).toBe('object');
    });
  });
});
