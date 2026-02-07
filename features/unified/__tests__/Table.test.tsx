import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedTable } from '../Table';

describe('UnifiedTable', () => {
  it('should convert pasted Excel TSV content into markdown table', async () => {
    const user = userEvent.setup();
    render(<UnifiedTable />);

    await user.click(screen.getByRole('button', { name: /markdown/i }));

    const textarea = screen.getByPlaceholderText(/paste or edit markdown table here/i);
    fireEvent.change(textarea, {
      target: {
        value: 'Name\tAge\tCity\nAlice\t30\tTaipei\nBob\t28\tTokyo'
      }
    });

    await waitFor(() => {
      const value = (textarea as HTMLTextAreaElement).value;
      expect(value).toContain('| Name');
      expect(value).toContain('| Alice');
      expect(value).toContain('| Bob');
    });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Age')).toBeInTheDocument();
      expect(screen.getByDisplayValue('City')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tokyo')).toBeInTheDocument();
    });
  });

  it('should preview HTML input and sync parsed table content', async () => {
    const user = userEvent.setup();
    render(<UnifiedTable />);

    await user.click(screen.getByRole('button', { name: /html/i }));

    const textarea = screen.getByPlaceholderText(/paste or edit html structure here/i);
    fireEvent.change(textarea, {
      target: {
        value: `<table>
  <thead>
    <tr><th>Name</th><th>Role</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>Admin</td></tr>
  </tbody>
</table>`
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('html-preview')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Role')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    });
  });
});
