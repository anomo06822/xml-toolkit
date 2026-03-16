// ============================================
// Format Selector Component
// ============================================

import React from 'react';
import { DataFormat } from '../../core';
import { FileCode, Braces, FileText } from 'lucide-react';

interface FormatSelectorProps {
  value: DataFormat;
  onChange: (format: DataFormat) => void;
  disabled?: boolean;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

const formats: { id: DataFormat; label: string; icon: React.ReactNode }[] = [
  { id: 'xml', label: 'XML', icon: <FileCode size={14} /> },
  { id: 'json', label: 'JSON', icon: <Braces size={14} /> },
  { id: 'markdown', label: 'Markdown', icon: <FileText size={14} /> }
];

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showLabels = true,
  size = 'md'
}) => {
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  
  return (
    <div className="flex bg-slate-900/70 rounded-lg p-1 border border-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {formats.map(format => (
        <button
          key={format.id}
          onClick={() => onChange(format.id)}
          disabled={disabled}
          className={`
            ${padding} rounded-md ${textSize} font-medium transition-colors flex items-center gap-1
            ${value === format.id 
              ? 'bg-primary/15 text-slate-100 ring-1 ring-primary/30' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {format.icon}
          {showLabels && <span>{format.label}</span>}
        </button>
      ))}
    </div>
  );
};
