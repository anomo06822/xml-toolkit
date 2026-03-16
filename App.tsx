import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AppTab } from './core';
import { 
  UnifiedFormatter, 
  UnifiedSorter, 
  UnifiedDiffer, 
  UnifiedConverter, 
  UnifiedVisualizer,
  UnifiedTable,
  UnifiedMarkdownPreview
} from './features/unified';
import { GeminiAssistant } from './features/GeminiAssistant';
import { GeminiApiLogs } from './features/GeminiApiLogs';
import { SettingsPage } from './features/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FORMATTER);
  const [appVersion, setAppVersion] = useState<string>('');

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
          '6': AppTab.MARKDOWN,
          '7': AppTab.TABLE,
          '8': AppTab.AI,
          '9': AppTab.API_LOGS,
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

  useEffect(() => {
    if (!window.electronAPI?.isElectron) return;
    window.electronAPI.desktop.getSettings()
      .then((desktop) => {
        setAppVersion(desktop.appVersion || '');
      })
      .catch(() => {
        setAppVersion('');
      });
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
      case AppTab.MARKDOWN:
        return <UnifiedMarkdownPreview />;
      case AppTab.TABLE:
        return <UnifiedTable />;
      case AppTab.AI:
        return <GeminiAssistant />;
      case AppTab.API_LOGS:
        return <GeminiApiLogs />;
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
      [AppTab.MARKDOWN]: 'Markdown Preview',
      [AppTab.TABLE]: 'Table Editor',
      [AppTab.AI]: 'AI Assistant',
      [AppTab.API_LOGS]: 'Gemini API Logs',
      [AppTab.SETTINGS]: 'Settings',
    };
    return titles[activeTab];
  };

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden bg-background text-slate-200 font-sans selection:bg-primary/20">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="app-header h-16 border-b flex items-center justify-between px-8 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>DataToolkit</span>
            {appVersion && (
              <>
                <span>/</span>
                <span className="text-slate-400">v{appVersion}</span>
              </>
            )}
            <span>/</span>
            <span className="text-slate-200 font-medium">{getTabTitle()}</span>
          </div>
          
          {/* Format badges */}
          <div className="flex items-center gap-2">
            <span className="format-pill format-pill-xml">XML</span>
            <span className="format-pill format-pill-json">JSON</span>
            <span className="format-pill format-pill-markdown">Markdown</span>
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
