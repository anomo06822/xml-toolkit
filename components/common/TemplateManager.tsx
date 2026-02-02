// ============================================
// Template Manager Component
// ============================================

import React, { useState, useEffect } from 'react';
import { SavedTemplate, DataFormat } from '../../core';
import { getTemplates, saveTemplate, deleteTemplate, getTemplatesByFormat } from '../../services';
import { Save, Trash2, FolderOpen, X, Tag, Clock } from 'lucide-react';
import { Button } from '../Button';
import { FormatSelector } from './FormatSelector';

interface TemplateManagerProps {
  currentContent: string;
  currentFormat: DataFormat;
  onLoad: (content: string, format: DataFormat) => void;
  compact?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentContent,
  currentFormat,
  onLoad,
  compact = false
}) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<DataFormat | 'all'>('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  
  useEffect(() => {
    loadTemplates();
  }, [filterFormat]);
  
  const loadTemplates = () => {
    if (filterFormat === 'all') {
      setTemplates(getTemplates());
    } else {
      setTemplates(getTemplatesByFormat(filterFormat));
    }
  };
  
  const handleSave = () => {
    if (!newTemplateName.trim()) return;
    
    saveTemplate({
      name: newTemplateName,
      content: currentContent,
      format: currentFormat,
      description: newTemplateDesc || undefined
    });
    
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowSaveModal(false);
    loadTemplates();
  };
  
  const handleLoad = (template: SavedTemplate) => {
    onLoad(template.content, template.format);
    setSelectedId(template.id);
  };
  
  const handleDelete = (id: string) => {
    if (!confirm('Delete this template?')) return;
    deleteTemplate(id);
    if (selectedId === id) setSelectedId('');
    loadTemplates();
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (compact) {
    return (
      <div className="flex gap-2 items-center">
        <select
          value={selectedId}
          onChange={e => {
            const template = templates.find(t => t.id === e.target.value);
            if (template) handleLoad(template);
          }}
          className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary"
        >
          <option value="">Load template...</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              [{t.format.toUpperCase()}] {t.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => setShowSaveModal(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
          title="Save as template"
        >
          <Save size={14} />
        </button>
        
        {showSaveModal && (
          <SaveModal
            onClose={() => setShowSaveModal(false)}
            onSave={handleSave}
            name={newTemplateName}
            setName={setNewTemplateName}
            description={newTemplateDesc}
            setDescription={setNewTemplateDesc}
            format={currentFormat}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-surface border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FolderOpen size={16} className="text-primary" />
          Templates
        </h3>
        
        <div className="flex gap-2">
          <select
            value={filterFormat}
            onChange={e => setFilterFormat(e.target.value as DataFormat | 'all')}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md px-2 py-1"
          >
            <option value="all">All formats</option>
            <option value="xml">XML</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
          
          <Button size="sm" onClick={() => setShowSaveModal(true)} icon={<Save size={12} />}>
            Save
          </Button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-auto">
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No templates saved</p>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${selectedId === template.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }
              `}
              onClick={() => handleLoad(template)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded
                      ${template.format === 'xml' ? 'bg-blue-500/20 text-blue-400' : ''}
                      ${template.format === 'json' ? 'bg-green-500/20 text-green-400' : ''}
                      ${template.format === 'markdown' ? 'bg-purple-500/20 text-purple-400' : ''}
                    `}>
                      {template.format.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {template.name}
                    </span>
                  </div>
                  
                  {template.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{template.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
                    <Clock size={10} />
                    {formatDate(template.createdAt)}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(template.id);
                  }}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
          name={newTemplateName}
          setName={setNewTemplateName}
          description={newTemplateDesc}
          setDescription={setNewTemplateDesc}
          format={currentFormat}
        />
      )}
    </div>
  );
};

// Save Modal
const SaveModal: React.FC<{
  onClose: () => void;
  onSave: () => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  format: DataFormat;
}> = ({ onClose, onSave, name, setName, description, setDescription, format }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-slate-700 rounded-xl p-6 w-96 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Save Template</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="My template"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Brief description..."
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Format:</span>
            <span className={`
              font-bold px-2 py-0.5 rounded
              ${format === 'xml' ? 'bg-blue-500/20 text-blue-400' : ''}
              ${format === 'json' ? 'bg-green-500/20 text-green-400' : ''}
              ${format === 'markdown' ? 'bg-purple-500/20 text-purple-400' : ''}
            `}>
              {format.toUpperCase()}
            </span>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onSave} className="flex-1" disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
