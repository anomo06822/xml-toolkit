// ============================================
// Settings Page Component
// ============================================

import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, resetSettings, AppSettings, exportAllData, importData, GEMINI_MODEL_OPTIONS } from '../services';
import { Button } from '../components/Button';
import { FormatSelector } from '../components/common/FormatSelector';
import { DataFormat } from '../core';
import { Settings, Download, Upload, RotateCcw, Check, Save, Keyboard, Monitor, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const isElectron = Boolean(window.electronAPI?.isElectron);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [shortcutStatus, setShortcutStatus] = useState<string | null>(null);
  const [desktopAiStatus, setDesktopAiStatus] = useState<string | null>(null);
  const [desktopStatus, setDesktopStatus] = useState<string>('not-detected');
  const [desktopAiConfig, setDesktopAiConfig] = useState<ElectronAiConfigState | null>(null);
  const [desktopGeminiApiKey, setDesktopGeminiApiKey] = useState('');
  const [appVersion, setAppVersion] = useState<string>('');
  const [updaterState, setUpdaterState] = useState<ElectronUpdaterState | null>(null);

  const reloadDesktopAiConfig = async () => {
    if (!window.electronAPI?.isElectron) return;

    try {
      const aiConfig = await window.electronAPI.desktop.getAiConfig();
      setDesktopAiConfig(aiConfig);
    } catch {
      setDesktopAiConfig(null);
    }
  };
  
  useEffect(() => {
    const localSettings = getSettings();
    setSettings(localSettings);
    if (window.electronAPI?.isElectron) {
      void window.electronAPI.desktop.setWakeupShortcut(localSettings.globalWakeupShortcut);
      window.electronAPI.desktop.getSettings()
        .then((desktopSettings) => {
          setSettings((prev) => ({
            ...prev,
            globalWakeupShortcut: desktopSettings.wakeupShortcut || prev.globalWakeupShortcut
          }));
          setDesktopStatus(desktopSettings.backendRunning ? 'backend-running' : 'backend-stopped');
          setAppVersion(desktopSettings.appVersion || '');
        })
        .catch(() => {
          setDesktopStatus('backend-unknown');
        });
      void reloadDesktopAiConfig();

      window.electronAPI.desktop.getUpdaterState()
        .then((state) => setUpdaterState(state))
        .catch(() => setUpdaterState(null));

      const unsubscribe = window.electronAPI.desktop.onUpdaterEvent((event) => {
        if (event?.payload) {
          setUpdaterState(event.payload);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);
  
  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
  };
  
  const handleSave = async () => {
    updateSettings(settings);

    if (window.electronAPI?.isElectron) {
      const result = await window.electronAPI.desktop.setWakeupShortcut(settings.globalWakeupShortcut);
      if (result.ok) {
        setShortcutStatus(`Applied: ${result.accelerator}`);
      } else {
        setShortcutStatus(`Failed: ${result.error}`);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckForUpdates = async () => {
    const result = await window.electronAPI?.desktop.checkForUpdates();
    if (result && !result.ok && result.message) {
      setShortcutStatus(`Update check failed: ${result.message}`);
    }
  };

  const handleDownloadUpdate = async () => {
    const result = await window.electronAPI?.desktop.downloadUpdate();
    if (result && !result.ok && result.message) {
      setShortcutStatus(`Download failed: ${result.message}`);
    }
  };

  const handleInstallUpdate = async () => {
    await window.electronAPI?.desktop.quitAndInstall();
  };
  
  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      const defaults = resetSettings();
      setSettings(defaults);
    }
  };

  const handleSaveDesktopAiConfig = async () => {
    if (!window.electronAPI?.isElectron) {
      return;
    }

    const geminiApiKey = desktopGeminiApiKey.trim();
    if (!geminiApiKey) {
      setDesktopAiStatus('Enter a Gemini API key before saving.');
      return;
    }

    const result = await window.electronAPI.desktop.saveAiConfig({ geminiApiKey });
    if (result.ok) {
      setDesktopGeminiApiKey('');
      setDesktopAiConfig(result);
      setDesktopAiStatus(`Saved to ${result.configPath} using OS-protected storage.`);
    } else {
      setDesktopAiStatus(`Failed: ${result.error || 'Unable to save AI config.'}`);
    }
  };

  const handleClearDesktopAiConfig = async () => {
    if (!window.electronAPI?.isElectron) {
      return;
    }

    if (!confirm('Remove the stored Gemini API key from the desktop config file?')) {
      return;
    }

    const result = await window.electronAPI.desktop.clearAiConfig();
    if (result.ok) {
      setDesktopGeminiApiKey('');
      setDesktopAiConfig(result);
      setDesktopAiStatus('Stored Gemini API key removed.');
    } else {
      setDesktopAiStatus(`Failed: ${result.error || 'Unable to clear AI config.'}`);
    }
  };

  const describeAiSource = (source?: ElectronAiConfigState['source']) => {
    if (source === 'os-protected') return 'OS-protected local config';
    if (source === 'legacy-file') return 'legacy plaintext local file';
    return 'not configured';
  };
  
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datatoolkit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        setSettings(getSettings());
        setImportError(null);
        alert('Data imported successfully!');
      } else {
        setImportError('Failed to import data. Invalid format.');
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={28} className="text-primary" />
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
      </div>
      
      {/* Editor Settings */}
      <section className="bg-surface border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Editor</h2>
        
        <div className="space-y-4">
          {/* Default Format */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Default Format</label>
              <p className="text-xs text-slate-500">Format used when content type is unclear</p>
            </div>
            <FormatSelector 
              value={settings.defaultFormat} 
              onChange={(f) => handleChange('defaultFormat', f)}
              size="sm"
            />
          </div>
          
          {/* Indent Size */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Indent Size</label>
              <p className="text-xs text-slate-500">Number of spaces for indentation</p>
            </div>
            <select
              value={settings.indentSize}
              onChange={(e) => handleChange('indentSize', Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>
          
          {/* Font Size */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Font Size</label>
              <p className="text-xs text-slate-500">Editor font size in pixels</p>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
            </select>
          </div>
          
          {/* Line Numbers */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Show Line Numbers</label>
              <p className="text-xs text-slate-500">Display line numbers in editor</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLineNumbers}
                onChange={(e) => handleChange('showLineNumbers', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* Auto Detect */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Auto Detect Format</label>
              <p className="text-xs text-slate-500">Automatically detect input format</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoDetectFormat}
                onChange={(e) => handleChange('autoDetectFormat', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>

      {/* AI Settings */}
      <section className="bg-surface border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">AI</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Gemini Model</label>
              <p className="text-xs text-slate-500">
                Select which Gemini model is used by AI assistant and AI summary.
              </p>
            </div>
            <select
              value={settings.geminiModel}
              onChange={(e) => handleChange('geminiModel', e.target.value as AppSettings['geminiModel'])}
              className="w-80 max-w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              {GEMINI_MODEL_OPTIONS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Persist AI Request Logs</label>
              <p className="text-xs text-slate-500">
                Off by default. When enabled, only summarized Gemini request metadata is stored locally and never included in export/import.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.persistAiLogs}
                onChange={(e) => handleChange('persistAiLogs', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {isElectron ? (
            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Desktop Backend Secret</label>
                  <p className="text-xs text-slate-500">
                    Stored outside the app bundle in an OS-protected local config file and excluded from export/import.
                  </p>
                </div>
                <input
                  type="password"
                  value={desktopGeminiApiKey}
                  onChange={(e) => setDesktopGeminiApiKey(e.target.value)}
                  placeholder={desktopAiConfig?.configured ? 'Leave blank to keep existing key' : 'Paste Gemini API key'}
                  className="w-80 max-w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Config path: <span className="text-slate-300 break-all">{desktopAiConfig?.configPath || '(loading...)'}</span></div>
                <div>Current source: <span className="text-slate-300">{describeAiSource(desktopAiConfig?.source)}</span></div>
                <div>Configured: <span className="text-slate-300">{desktopAiConfig?.configured ? 'yes' : 'no'}</span></div>
              </div>

              {desktopAiConfig?.source === 'legacy-file' && (
                <p className="text-xs text-amber-300">
                  A legacy plaintext token file was detected. Save the token again to migrate it into OS-protected storage.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { void handleSaveDesktopAiConfig(); }}>
                  Save Backend Token
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { void handleClearDesktopAiConfig(); }}
                  disabled={!desktopAiConfig?.configured}
                  icon={<Trash2 size={14} />}
                >
                  Clear Stored Token
                </Button>
              </div>
              {desktopAiStatus && <p className="text-xs text-accent">{desktopAiStatus}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-2">
              <p>Web AI requests no longer accept browser-stored tokens.</p>
              <p>
                Configure the Gemini API key on the backend using
                <code className="text-slate-200 px-1">backend/DataToolkit.Api/appsettings.Local.json</code>
                during local development, or set
                <code className="text-slate-200 px-1">DATATOOLKIT_CONFIG_PATH</code>
                to a mounted secrets file in deployment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Desktop Settings */}
      {isElectron && (
        <section className="bg-surface border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-primary" />
            Desktop
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Keyboard size={14} />
                  Global Wakeup Shortcut
                </label>
                <p className="text-xs text-slate-500">
                  Example: CommandOrControl+Shift+Space. This shortcut wakes the app from anywhere.
                </p>
              </div>
              <input
                type="text"
                value={settings.globalWakeupShortcut}
                onChange={(e) => handleChange('globalWakeupShortcut', e.target.value)}
                placeholder="CommandOrControl+Shift+Space"
                className="w-80 max-w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                Desktop status: <span className="text-slate-300">{desktopStatus}</span>
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void window.electronAPI?.desktop.wakeup();
                }}
              >
                Test Wakeup
              </Button>
            </div>
            <div className="text-xs text-slate-500">
              Version: <span className="text-slate-300">{appVersion || '(unknown)'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => { void handleCheckForUpdates(); }}>
                Check Updates
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { void handleDownloadUpdate(); }}
                disabled={updaterState?.status !== 'available'}
              >
                Download Update
              </Button>
              <Button
                size="sm"
                onClick={() => { void handleInstallUpdate(); }}
                disabled={updaterState?.status !== 'downloaded'}
              >
                Restart and Install
              </Button>
            </div>
            <div className="text-xs text-slate-500">
              Update status: <span className="text-slate-300">{updaterState?.status || 'idle'}</span>
              {updaterState?.message ? <span className="ml-2 text-slate-400">{updaterState.message}</span> : null}
            </div>
            {typeof updaterState?.progress === 'number' && updaterState.progress > 0 && updaterState.progress < 100 && (
              <div className="h-2 w-full rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.round(updaterState.progress)}%` }} />
              </div>
            )}
            {shortcutStatus && <p className="text-xs text-accent">{shortcutStatus}</p>}
          </div>
        </section>
      )}
      
      {/* Data Management */}
      <section className="bg-surface border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Data Management</h2>
        
        <div className="space-y-4">
          {/* Export */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Export Data</label>
              <p className="text-xs text-slate-500">Download templates and settings. Desktop secrets and AI conversation/log context stay out of backup files.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport} icon={<Download size={14} />}>
              Export
            </Button>
          </div>
          
          {/* Import */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-slate-300">Import Data</label>
              <p className="text-xs text-slate-500">Restore from a backup file</p>
              {importError && <p className="text-xs text-red-400 mt-1">{importError}</p>}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="secondary" size="sm" icon={<Upload size={14} />} as="span">
                Import
              </Button>
            </label>
          </div>
        </div>
      </section>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="danger" onClick={handleReset} icon={<RotateCcw size={14} />}>
          Reset to Defaults
        </Button>
        
        <Button onClick={handleSave} icon={saved ? <Check size={14} /> : <Save size={14} />}>
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
