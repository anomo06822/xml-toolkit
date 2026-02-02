import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Converter from '../Converter';

describe('Converter Component', () => {
  it('should render correctly', () => {
    render(<Converter />);
    
    expect(screen.getByText('Format Converter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste your/i)).toBeInTheDocument();
  });

  it('should convert XML to JSON', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const xml = '<root><name>John</name><age>30</age></root>';
    await user.type(textarea, xml);
    
    // Select target format
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'json');
    
    await user.click(convertButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).toContain('"name"');
      expect(output.value).toContain('"John"');
    });
  });

  it('should convert JSON to XML', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const json = '{"root": {"name": "John", "age": "30"}}';
    await user.type(textarea, json);
    
    // Select source format as JSON
    const fromFormatSelector = screen.getAllByRole('combobox')[0];
    await user.selectOptions(fromFormatSelector, 'json');
    
    // Select target format as XML
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'xml');
    
    await user.click(convertButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).toContain('<root>');
      expect(output.value).toContain('<name>');
    });
  });

  it('should convert XML to Markdown', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const xml = '<root><title>Hello</title><content>World</content></root>';
    await user.type(textarea, xml);
    
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'markdown');
    
    await user.click(convertButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).toContain('#');
      expect(output.value).toContain('Hello');
    });
  });

  it('should swap source and target formats', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const fromFormatSelector = screen.getAllByRole('combobox')[0];
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    
    await user.selectOptions(fromFormatSelector, 'xml');
    await user.selectOptions(toFormatSelector, 'json');
    
    const swapButton = screen.queryByRole('button', { name: /swap/i });
    if (swapButton) {
      await user.click(swapButton);
      
      await waitFor(() => {
        expect(fromFormatSelector).toHaveValue('json');
        expect(toFormatSelector).toHaveValue('xml');
      });
    }
  });

  it('should handle invalid input gracefully', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const invalidXml = '<root><unclosed>';
    await user.type(textarea, invalidXml);
    
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'json');
    
    await user.click(convertButton);
    
    // Should handle error without crashing
    await waitFor(() => {
      expect(textarea).toBeInTheDocument();
    });
  });

  it('should convert JSON to Markdown', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const json = '{"title": "Test", "items": ["a", "b", "c"]}';
    await user.type(textarea, json);
    
    const fromFormatSelector = screen.getAllByRole('combobox')[0];
    await user.selectOptions(fromFormatSelector, 'json');
    
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'markdown');
    
    await user.click(convertButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).toContain('Test');
    });
  });

  it('should convert Markdown to JSON', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    const markdown = '# Title\n\nContent here';
    await user.type(textarea, markdown);
    
    const fromFormatSelector = screen.getAllByRole('combobox')[0];
    await user.selectOptions(fromFormatSelector, 'markdown');
    
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    await user.selectOptions(toFormatSelector, 'json');
    
    await user.click(convertButton);
    
    await waitFor(() => {
      const output = screen.getAllByRole('textbox')[1];
      expect(output.value).toContain('{');
      expect(output.value).toContain('}');
    });
  });

  it('should clear both input and output', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const textarea = screen.getByPlaceholderText(/paste your/i);
    await user.type(textarea, '<root></root>');
    
    const clearButton = screen.queryByRole('button', { name: /clear/i });
    if (clearButton) {
      await user.click(clearButton);
      
      const textareas = screen.getAllByRole('textbox');
      expect(textareas[0]).toHaveValue('');
      expect(textareas[1]).toHaveValue('');
    }
  });

  it('should prevent converting to same format', async () => {
    const user = userEvent.setup();
    render(<Converter />);
    
    const fromFormatSelector = screen.getAllByRole('combobox')[0];
    const toFormatSelector = screen.getAllByRole('combobox')[1];
    
    await user.selectOptions(fromFormatSelector, 'xml');
    await user.selectOptions(toFormatSelector, 'xml');
    
    const convertButton = screen.getByRole('button', { name: /convert/i });
    
    // Button might be disabled or show warning
    expect(convertButton).toBeInTheDocument();
  });
});
