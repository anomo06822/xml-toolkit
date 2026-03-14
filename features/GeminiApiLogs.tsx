import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { clearGeminiApiLogs, GeminiApiLogEntry, getGeminiApiLogs, getSettings } from '../services';
import { RefreshCw, Trash2 } from 'lucide-react';

export const GeminiApiLogs: React.FC = () => {
  const [logs, setLogs] = useState<GeminiApiLogEntry[]>([]);
  const [persistAiLogs, setPersistAiLogs] = useState<boolean>(() => getSettings().persistAiLogs);

  const reloadLogs = () => {
    setPersistAiLogs(getSettings().persistAiLogs);
    setLogs(getGeminiApiLogs());
  };

  useEffect(() => {
    reloadLogs();
  }, []);

  const handleClearLogs = () => {
    if (confirm('Clear all Gemini API logs?')) {
      clearGeminiApiLogs();
      reloadLogs();
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Gemini API Logs</h2>
          <p className="text-sm text-slate-400">
            View summarized Gemini request metadata for Assistant and Diff Summary calls.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reloadLogs} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="danger" onClick={handleClearLogs} icon={<Trash2 size={14} />} disabled={!persistAiLogs || logs.length === 0}>
            Clear Logs
          </Button>
        </div>
      </div>

      {!persistAiLogs ? (
        <div className="bg-surface border border-slate-700 rounded-lg p-8 text-center text-slate-500">
          Logging is disabled. Enable <span className="text-slate-300">Persist AI Request Logs</span> in Settings to keep local request summaries.
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-surface border border-slate-700 rounded-lg p-8 text-center text-slate-500">
          No logs yet. Make a Gemini request in AI Assistant or Diff Summary first.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-surface border border-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded font-medium ${log.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {log.success ? 'SUCCESS' : 'ERROR'}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{log.source}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{log.model}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">provider: {log.provider}</span>
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Request Summary</div>
                  <pre className="bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 overflow-auto max-h-80 whitespace-pre-wrap break-all">
                    {log.requestBody}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Response Summary</div>
                  <pre className="bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 overflow-auto max-h-80 whitespace-pre-wrap break-all">
                    {log.responseBody || log.error || '(empty)'}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
