import { describe, it, expect } from 'vitest';
import { computeDiff, DiffLine } from '../diff';

describe('diff (LCS algorithm)', () => {
  describe('computeDiff', () => {
    it('should detect identical content', () => {
      const text1 = 'line1\nline2\nline3';
      const text2 = 'line1\nline2\nline3';
      const result = computeDiff(text1, text2);
      
      expect(result.every(line => line.type === 'unchanged')).toBe(true);
      expect(result.length).toBe(3);
    });

    it('should detect additions', () => {
      const text1 = 'line1\nline2';
      const text2 = 'line1\nline2\nline3';
      const result = computeDiff(text1, text2);
      
      const addedLines = result.filter(line => line.type === 'added');
      expect(addedLines.length).toBe(1);
      expect(addedLines[0].content).toBe('line3');
    });

    it('should detect deletions', () => {
      const text1 = 'line1\nline2\nline3';
      const text2 = 'line1\nline3';
      const result = computeDiff(text1, text2);
      
      const deletedLines = result.filter(line => line.type === 'removed');
      expect(deletedLines.length).toBe(1);
      expect(deletedLines[0].content).toBe('line2');
    });

    it('should detect modifications', () => {
      const text1 = 'line1\noriginal\nline3';
      const text2 = 'line1\nmodified\nline3';
      const result = computeDiff(text1, text2);
      
      const changed = result.filter(line => line.type !== 'unchanged');
      expect(changed.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      const text1 = '';
      const text2 = 'line1';
      const result = computeDiff(text1, text2);
      
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('added');
    });

    it('should handle one empty string', () => {
      const text1 = 'line1\nline2';
      const text2 = '';
      const result = computeDiff(text1, text2);
      
      const removedLines = result.filter(line => line.type === 'removed');
      expect(removedLines.length).toBe(2);
    });

    it('should handle both empty strings', () => {
      const text1 = '';
      const text2 = '';
      const result = computeDiff(text1, text2);
      
      expect(result.length).toBe(0);
    });

    it('should handle complex changes', () => {
      const text1 = 'a\nb\nc\nd';
      const text2 = 'a\nx\nc\ny\nd';
      const result = computeDiff(text1, text2);
      
      // Should detect that 'a', 'c', and 'd' are unchanged
      const unchanged = result.filter(line => line.type === 'unchanged');
      expect(unchanged.length).toBe(3);
    });

    it('should maintain correct line numbers', () => {
      const text1 = 'line1\nline2\nline3';
      const text2 = 'line1\ninserted\nline2\nline3';
      const result = computeDiff(text1, text2);
      
      // Check that line numbers are assigned
      expect(result.every(line => 
        (line.type === 'removed' && line.oldLineNumber !== undefined) ||
        (line.type === 'added' && line.newLineNumber !== undefined) ||
        (line.type === 'unchanged' && line.oldLineNumber !== undefined && line.newLineNumber !== undefined)
      )).toBe(true);
    });

    it('should handle whitespace differences', () => {
      const text1 = 'line1\nline2';
      const text2 = 'line1  \nline2';
      const result = computeDiff(text1, text2);
      
      // Should detect the difference in whitespace
      const changed = result.filter(line => line.type !== 'unchanged');
      expect(changed.length).toBeGreaterThan(0);
    });

    it('should handle complete replacement', () => {
      const text1 = 'a\nb\nc';
      const text2 = 'x\ny\nz';
      const result = computeDiff(text1, text2);
      
      const removed = result.filter(line => line.type === 'removed');
      const added = result.filter(line => line.type === 'added');
      
      expect(removed.length).toBe(3);
      expect(added.length).toBe(3);
    });

    it('should handle single line comparison', () => {
      const text1 = 'single line';
      const text2 = 'different line';
      const result = computeDiff(text1, text2);
      
      expect(result.length).toBe(2);
      expect(result[0].type).toBe('removed');
      expect(result[1].type).toBe('added');
    });

    it('should preserve content correctly', () => {
      const text1 = 'alpha\nbeta\ngamma';
      const text2 = 'alpha\ndelta\ngamma';
      const result = computeDiff(text1, text2);
      
      expect(result.find(l => l.content === 'alpha')?.type).toBe('unchanged');
      expect(result.find(l => l.content === 'beta')?.type).toBe('removed');
      expect(result.find(l => l.content === 'delta')?.type).toBe('added');
      expect(result.find(l => l.content === 'gamma')?.type).toBe('unchanged');
    });

    it('should handle multiple consecutive additions', () => {
      const text1 = 'a\nb';
      const text2 = 'a\nx\ny\nz\nb';
      const result = computeDiff(text1, text2);
      
      const added = result.filter(line => line.type === 'added');
      expect(added.length).toBe(3);
    });

    it('should handle multiple consecutive deletions', () => {
      const text1 = 'a\nx\ny\nz\nb';
      const text2 = 'a\nb';
      const result = computeDiff(text1, text2);
      
      const removed = result.filter(line => line.type === 'removed');
      expect(removed.length).toBe(3);
    });

    it('should handle interleaved changes', () => {
      const text1 = '1\n2\n3\n4\n5';
      const text2 = '1\nA\n3\nB\n5';
      const result = computeDiff(text1, text2);
      
      const unchanged = result.filter(line => line.type === 'unchanged');
      expect(unchanged.length).toBe(3); // 1, 3, 5
      
      const removed = result.filter(line => line.type === 'removed');
      expect(removed.length).toBe(2); // 2, 4
      
      const added = result.filter(line => line.type === 'added');
      expect(added.length).toBe(2); // A, B
    });

    it('should handle case sensitivity', () => {
      const text1 = 'Hello\nWorld';
      const text2 = 'hello\nworld';
      const result = computeDiff(text1, text2);
      
      const unchanged = result.filter(line => line.type === 'unchanged');
      expect(unchanged.length).toBe(0);
    });

    it('should handle special characters', () => {
      const text1 = '<tag>\n{json}\n[array]';
      const text2 = '<tag>\n{json}\n[array]';
      const result = computeDiff(text1, text2);
      
      expect(result.every(line => line.type === 'unchanged')).toBe(true);
    });

    it('should handle very long lines', () => {
      const longLine = 'a'.repeat(1000);
      const text1 = `${longLine}\nshort`;
      const text2 = `${longLine}\nshort`;
      const result = computeDiff(text1, text2);
      
      expect(result.every(line => line.type === 'unchanged')).toBe(true);
    });
  });
});
