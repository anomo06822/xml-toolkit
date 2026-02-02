import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AppTab } from './core';
import { 
  UnifiedFormatter, 
  UnifiedSorter, 
  UnifiedDiffer, 
  UnifiedConverter, 
  UnifiedVisualizer 
} from './features/unified';
import { GeminiAssistant } from './features/GeminiAssistant';
import { SettingsPage } from './features/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FORMATTER);

  // Hotkey System
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const tabMap: Record<string, AppTab> = {
          '1': AppTab.FORMATTER,
          '2': AppTab.SORTER,
          '3': AppTab.DIFF,
          '4': AppTab.CONVERTER,
          '5': AppTab.VISUALIZER,
          '6': AppTab.AI,
        };
        
        if (tabMap[e.key]) {
          e.preventDefault();
          setActiveTab(tabMap[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.FORMATTER:
        return <UnifiedFormatter />;
      case AppTab.SORTER:
        return <UnifiedSorter />;
      case AppTab.DIFF:
        return <UnifiedDiffer />;
      case AppTab.CONVERTER:
        return <UnifiedConverter />;
      case AppTab.VISUALIZER:
        return <UnifiedVisualizer />;
      case AppTab.AI:
        return <GeminiAssistant />;
      case AppTab.SETTINGS:
        return <SettingsPage />;
      default:
        return <UnifiedFormatter />;
    }
  };

  const getTabTitle = () => {
    const titles: Record<AppTab, string> = {
      [AppTab.FORMATTER]: 'Format & Beautify',
      [AppTab.SORTER]: 'Sort',
      [AppTab.DIFF]: 'Compare / Diff',
      [AppTab.CONVERTER]: 'Convert',
      [AppTab.VISUALIZER]: 'Visualize',
      [AppTab.AI]: 'AI Assistant',
      [AppTab.SETTINGS]: 'Settings',
    };
    return titles[activeTab];
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>DataToolkit</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">{getTabTitle()}</span>
          </div>
          
          {/* Format badges */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-medium">XML</span>
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-medium">JSON</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-medium">Markdown</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
