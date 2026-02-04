import React, { useEffect, useState } from 'react';
import { AppTab } from '../core';
import { AppSettings, clearAllData, GEMINI_MODEL_OPTIONS, getSettings, updateSettings } from '../services';
import { 
  AlignLeft, ArrowDownAZ, GitCompare, ArrowLeftRight, 
  Network, Sparkles, FileCode, FileText, Trash2, Settings, Table2, ScrollText
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [geminiModel, setGeminiModel] = useState<AppSettings['geminiModel']>(() => getSettings().geminiModel);

  useEffect(() => {
    setGeminiModel(getSettings().geminiModel);
  }, [activeTab]);

  const items = [
    { 
      id: AppTab.FORMATTER, 
      label: 'Format', 
      icon: <AlignLeft size={20} />,
      description: 'Format & beautify'
    },
    { 
      id: AppTab.SORTER, 
      label: 'Sort', 
      icon: <ArrowDownAZ size={20} />,
      description: 'Sort keys/nodes'
    },
    { 
      id: AppTab.DIFF, 
      label: 'Compare', 
      icon: <GitCompare size={20} />,
      description: 'Diff & compare'
    },
    { 
      id: AppTab.CONVERTER, 
      label: 'Convert', 
      icon: <ArrowLeftRight size={20} />,
      description: 'Convert formats'
    },
    { 
      id: AppTab.VISUALIZER, 
      label: 'Visualize', 
      icon: <Network size={20} />,
      description: 'Tree/graph view'
    },
    { 
      id: AppTab.MARKDOWN, 
      label: 'Markdown', 
      icon: <FileText size={20} />,
      description: 'README preview'
    },
    { 
      id: AppTab.TABLE, 
      label: 'Table', 
      icon: <Table2 size={20} />,
      description: 'Markdown tables'
    },
    { 
      id: AppTab.AI, 
      label: 'AI Assistant', 
      icon: <Sparkles size={20} />, 
      highlight: true,
      description: 'Gemini powered'
    },
    {
      id: AppTab.API_LOGS,
      label: 'API Logs',
      icon: <ScrollText size={20} />,
      description: 'Gemini requests'
    },
  ];

  const handleClearData = () => {
    if (confirm('Clear all saved data and reset the application?')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleModelChange = (model: AppSettings['geminiModel']) => {
    setGeminiModel(model);
    updateSettings({ geminiModel: model });
  };

  return (
    <div className="w-64 bg-surface border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
          <FileCode size={22} />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-lg tracking-tight">DataToolkit</h1>
          <p className="text-[10px] text-slate-500">XML • JSON • Markdown</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 mb-2">
          Tools
        </div>
        
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === item.id 
                ? item.highlight 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <span className={`
              ${activeTab === item.id 
                ? (item.highlight ? 'text-purple-400' : 'text-primary') 
                : 'text-slate-500 group-hover:text-slate-300'
              }
            `}>
              {item.icon}
            </span>
            <div className="flex-1 text-left">
              <span className="font-medium block">{item.label}</span>
              <span className={`
                text-[10px] 
                ${activeTab === item.id ? 'text-current opacity-60' : 'text-slate-600'}
              `}>
                {item.description}
              </span>
            </div>
          </button>
        ))}

        <div className="mt-4 px-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Gemini Model
          </div>
          <select
            value={geminiModel}
            onChange={(e) => handleModelChange(e.target.value as AppSettings['geminiModel'])}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
          >
            {GEMINI_MODEL_OPTIONS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        {/* Settings Button */}
        <button
          onClick={() => setActiveTab(AppTab.SETTINGS)}
          className={`
            w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm
            ${activeTab === AppTab.SETTINGS
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }
          `}
        >
          <Settings size={16} />
          Settings
        </button>
        
        {/* Storage Info */}
        <div className="bg-slate-900/50 rounded-lg p-3 text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500">Saved Data</span>
            <button
              onClick={handleClearData}
              className="text-red-400 hover:text-red-300 flex items-center gap-1"
              title="Clear all data"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
          <p className="text-slate-600">
            Templates and history are stored locally in your browser.
          </p>
        </div>
        
        {/* Hotkey hint */}
        <div className="text-center text-[10px] text-slate-600">
          <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">Alt</kbd>
          <span className="mx-1">+</span>
          <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">1-9</kbd>
          <span className="ml-1">to switch tabs</span>
        </div>
      </div>
    </div>
  );
};
