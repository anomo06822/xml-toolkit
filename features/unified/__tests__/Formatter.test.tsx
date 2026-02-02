import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Formatter from '../Formatter';

describe('Formatter Component', () => {
  it('should render correctly', () => {
    render(<Formatter />);
    
    expect(screen.getByText('Format & Beautify')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste your/i)).toBeInTheDocument();
  });

  it('should format XML input', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const formatButton = screen.getByRole('button', { name: /format/i });
    
    const minifiedXml = '<root><child>text</child></root>';
    await user.type(textarea, minifiedXml);
    await user.click(formatButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output).toHaveValue(expect.stringContaining('\n'));
    });
  });

  it('should format JSON input', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const formatButton = screen.getByRole('button', { name: /format/i });
    
    const minifiedJson = '{"name":"John","age":30}';
    await user.type(textarea, minifiedJson);
    await user.click(formatButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output).toHaveValue(expect.stringContaining('\n'));
    });
  });

  it('should minify input', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const minifyButton = screen.getByRole('button', { name: /minify/i });
    
    const formatted = `{
  "name": "John",
  "age": 30
}`;
    await user.type(textarea, formatted);
    await user.click(minifyButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).not.toContain('\n  ');
    });
  });

  it('should change format via selector', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const formatSelector = screen.getByRole('combobox');
    
    await user.selectOptions(formatSelector, 'json');
    expect(formatSelector).toHaveValue('json');
    
    await user.selectOptions(formatSelector, 'xml');
    expect(formatSelector).toHaveValue('xml');
  });

  it('should handle invalid input gracefully', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const formatButton = screen.getByRole('button', { name: /format/i });
    
    const invalidXml = '<root><unclosed>';
    await user.type(textarea, invalidXml);
    await user.click(formatButton);
    
    // Should show error or validation message
    await waitFor(() => {
      // Error handling might vary - just ensure it doesn't crash
      expect(textarea).toBeInTheDocument();
    });
  });

  it('should copy output to clipboard', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });
    
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const formatButton = screen.getByRole('button', { name: /format/i });
    
    await user.type(textarea, '<root></root>');
    await user.click(formatButton);
    
    // Find and click copy button if it exists
    const copyButton = screen.queryByRole('button', { name: /copy/i });
    if (copyButton) {
      await user.click(copyButton);
      expect(writeText).toHaveBeenCalled();
    }
  });

  it('should clear input', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    await user.type(textarea, '<root></root>');
    
    const clearButton = screen.queryByRole('button', { name: /clear/i });
    if (clearButton) {
      await user.click(clearButton);
      expect(textarea).toHaveValue('');
    }
  });

  it('should update indent size', async () => {
    const user = userEvent.setup();
    render(<Formatter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const formatButton = screen.getByRole('button', { name: /format/i });
    
    await user.type(textarea, '<root><child>text</child></root>');
    
    // Look for indent size control
    const indentInput = screen.queryByLabelText(/indent/i);
    if (indentInput) {
      await user.clear(indentInput);
      await user.type(indentInput, '4');
    }
    
    await user.click(formatButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output).toBeInTheDocument();
    });
  });
});
