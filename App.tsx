import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { XmlConverter } from './features/XmlConverter';
import { Visualizer } from './features/Visualizer';
import { Sorter } from './features/Sorter';
import { Differ } from './features/Differ';
import { XmlMinifier } from './features/XmlMinifier';
import { GeminiAssistant } from './features/GeminiAssistant';
import { AppTab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CONVERTER);

  // Feature 5: Hotkey System (Simple Implementation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation Hotkeys: Alt + 1-6
      if (e.altKey) {
        if (e.key === '1') setActiveTab(AppTab.CONVERTER);
        if (e.key === '2') setActiveTab(AppTab.TREE);
        if (e.key === '3') setActiveTab(AppTab.SORTER);
        if (e.key === '4') setActiveTab(AppTab.DIFF);
        if (e.key === '5') setActiveTab(AppTab.MINIFIER);
        if (e.key === '6') setActiveTab(AppTab.AI);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.CONVERTER: return <XmlConverter />;
      case AppTab.TREE: return <Visualizer />;
      case AppTab.SORTER: return <Sorter />;
      case AppTab.DIFF: return <Differ />;
      case AppTab.MINIFIER: return <XmlMinifier />;
      case AppTab.AI: return <GeminiAssistant />;
      default: return <XmlConverter />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-slate-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span>Application</span>
             <span>/</span>
             <span className="text-slate-200 font-medium capitalize">{activeTab.replace('-', ' ')}</span>
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