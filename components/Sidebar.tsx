import React from 'react';
import { AppTab } from '../types';
import { clearAppCache } from '../hooks/usePersistentState';
import { FileJson, Network, ArrowDownAZ, GitCompare, Sparkles, FileCode, Send, Trash2 } from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: AppTab.CONVERTER, label: 'Converter', icon: <FileJson size={20} /> },
    { id: AppTab.TREE, label: 'Visualizer', icon: <Network size={20} /> },
    { id: AppTab.SORTER, label: 'Sorter', icon: <ArrowDownAZ size={20} /> },
    { id: AppTab.DIFF, label: 'Diff', icon: <GitCompare size={20} /> },
    { id: AppTab.MINIFIER, label: 'API Builder', icon: <Send size={20} /> },
    { id: AppTab.AI, label: 'Gemini AI', icon: <Sparkles size={20} />, highlight: true },
  ];

  return (
    <div className="w-64 bg-surface border-r border-slate-700 flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
          <FileCode size={20} />
        </div>
        <h1 className="font-bold text-slate-100 text-lg tracking-tight">XmlToolkit</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
              ${activeTab === item.id 
                ? item.highlight 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }
            `}
          >
            <span className={`${activeTab === item.id ? (item.highlight ? 'text-purple-400' : 'text-primary') : 'text-slate-500 group-hover:text-slate-300'}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Storage</span>
          <button
             onClick={clearAppCache}
             className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline transition-colors"
             title="Reset all application data"
          >
            <Trash2 size={10} /> Clear
          </button>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 mb-1">Pro Tip</p>
          <p>Use <kbd className="bg-slate-700 px-1 rounded text-slate-300">Ctrl+Shift+F</kbd> to format XML in the editor.</p>
        </div>
      </div>
    </div>
  );
};