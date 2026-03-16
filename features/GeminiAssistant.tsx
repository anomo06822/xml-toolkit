import React, { useMemo, useState } from 'react';
import {
  addGeminiUploadHistory,
  addGeminiApiLog,
  getGeminiUploadHistory,
  getAiContext,
  getGeminiModel,
  getPersistentValue,
  GeminiUploadHistoryEntry,
  setAiContextByFormat,
  setPersistentValue
} from '../services/storage';
import { generateGeminiContent, getGeminiSetupHint } from '../services';
import { Button } from '../components/Button';
import { DataFormat } from '../core';
import { Sparkles, MessageSquare, Loader2, Copy, Check, Trash2, Upload, Plus, Save, Pencil, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PromptPreset {
  id: string;
  name: string;
  systemPrompt: string;
  customPrompt: string;
  createdAt: number;
  updatedAt: number;
}

type ContextFormat = DataFormat | 'text';
const LOG_PREVIEW_LIMIT = 240;

const DEFAULT_SYSTEM_PROMPT = `You are an expert in data formats including XML, JSON, and Markdown.
You help users with:
- Schema generation (XSD, JSON Schema)
- Format conversion and transformation
- XSLT creation
- Data structure analysis
- TypeScript/JavaScript interface generation
- Validation and error fixing
- Best practices and optimization

Provide clear, concise, and practical answers. Include code examples when relevant.`;

const PROMPT_PRESETS_KEY = 'gemini_prompt_presets';

export const GeminiAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() =>
    getPersistentValue<Message[]>('gemini_messages', [])
  );
  const [includeContext, setIncludeContext] = useState<boolean>(() =>
    getPersistentValue<boolean>('gemini_include_context', true)
  );
  const [includeContextFormats, setIncludeContextFormats] = useState<Record<ContextFormat, boolean>>(() => {
    const saved = getPersistentValue<Partial<Record<ContextFormat, boolean>>>('gemini_include_context_formats', {});
    return {
      xml: saved.xml ?? true,
      json: saved.json ?? true,
      markdown: saved.markdown ?? true,
      text: saved.text ?? true
    };
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(() =>
    getPersistentValue<string>('gemini_system_prompt', DEFAULT_SYSTEM_PROMPT)
  );
  const [customPrompt, setCustomPrompt] = useState<string>(() =>
    getPersistentValue<string>('gemini_custom_prompt', '')
  );
  const [promptPresets, setPromptPresets] = useState<PromptPreset[]>(() =>
    getPersistentValue<PromptPreset[]>(PROMPT_PRESETS_KEY, [])
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetName, setPresetName] = useState('');
  const [uploadHistory, setUploadHistory] = useState<GeminiUploadHistoryEntry[]>(() => getGeminiUploadHistory());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const context = getAiContext();

  const selectedPreset = useMemo(
    () => promptPresets.find((p) => p.id === selectedPresetId),
    [promptPresets, selectedPresetId]
  );

  const savePrompts = (nextSystem: string, nextCustom: string) => {
    setSystemPrompt(nextSystem);
    setCustomPrompt(nextCustom);
    setPersistentValue('gemini_system_prompt', nextSystem);
    setPersistentValue('gemini_custom_prompt', nextCustom);
  };

  const savePresetList = (presets: PromptPreset[]) => {
    setPromptPresets(presets);
    setPersistentValue(PROMPT_PRESETS_KEY, presets);
  };

  const createPreview = (content: string, limit = LOG_PREVIEW_LIMIT): string => {
    const normalized = content.trim();
    if (!normalized) return '';
    return normalized.length > limit
      ? `${normalized.slice(0, limit)}...[truncated ${normalized.length - limit} chars]`
      : normalized;
  };

  const buildContextSection = (): string => {
    const MAX_CONTEXT_LENGTH = 4000;
    const clip = (content?: string) => {
      if (!content) return '(none)';
      return content.length > MAX_CONTEXT_LENGTH
        ? `${content.slice(0, MAX_CONTEXT_LENGTH)}\n...[truncated ${content.length - MAX_CONTEXT_LENGTH} chars]`
        : content;
    };

    const xmlSection = includeContextFormats.xml ? clip(context.xml) : '(excluded)';
    const jsonSection = includeContextFormats.json ? clip(context.json) : '(excluded)';
    const markdownSection = includeContextFormats.markdown ? clip(context.markdown) : '(excluded)';
    const textSection = includeContextFormats.text ? clip(context.text) : '(excluded)';

    return `Workspace context:

XML:
${xmlSection}

JSON:
${jsonSection}

MARKDOWN:
${markdownSection}

TEXT:
${textSection}`;
  };

  const handleAskGemini = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const model = getGeminiModel();

      const promptSuffix = customPrompt.trim() ? `\n\nCustom prompt:\n${customPrompt.trim()}` : '';
      const contextSection = includeContext ? `\n\n${buildContextSection()}` : '';
      const requestBody = {
        model,
        contents: `${systemPrompt}${promptSuffix}${contextSection}\n\nUser: ${input}`,
      };

      const result = await generateGeminiContent({
        model: requestBody.model,
        contents: requestBody.contents,
      });

      addGeminiApiLog({
        source: 'assistant',
        model,
        provider: result.provider,
        requestBody: JSON.stringify({
          model,
          includeContext,
          includedFormats: Object.entries(includeContextFormats)
            .filter(([, enabled]) => enabled)
            .map(([format]) => format),
          systemPromptChars: systemPrompt.length,
          customPromptChars: customPrompt.trim().length,
          promptChars: requestBody.contents.length,
          promptPreview: createPreview(input)
        }, null, 2),
        responseBody: JSON.stringify({
          provider: result.provider,
          textChars: (result.text || '').length,
          textPreview: createPreview(result.text || '')
        }, null, 2),
        success: true
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.text || 'No response generated.',
        timestamp: Date.now()
      };

      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      setPersistentValue('gemini_messages', newMessages);
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${e.message}\n\n${getGeminiSetupHint()}`,
        timestamp: Date.now()
      };

      addGeminiApiLog({
        source: 'assistant',
        model: getGeminiModel(),
        provider: window.electronAPI?.isElectron ? 'electron-backend' : 'http-backend',
        requestBody: JSON.stringify({
          promptChars: input.length,
          promptPreview: createPreview(input)
        }, null, 2),
        error: e?.message || 'Unknown error',
        success: false
      });

      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let targetFormat: ContextFormat = 'text';

      if (extension === 'xml') targetFormat = 'xml';
      else if (extension === 'json') targetFormat = 'json';
      else if (extension === 'md' || extension === 'markdown') targetFormat = 'markdown';
      else if (extension !== 'txt') {
        const trimmed = content.trim();
        if (trimmed.startsWith('<')) targetFormat = 'xml';
        else if (trimmed.startsWith('{') || trimmed.startsWith('[')) targetFormat = 'json';
        else if (trimmed.startsWith('#') || trimmed.includes('\n- ') || trimmed.includes('\n## ')) targetFormat = 'markdown';
      }

      setInput(content);
      const source = `upload:${file.name}`;
      setAiContextByFormat(targetFormat, content, source);
      addGeminiUploadHistory({ name: file.name, format: targetFormat, content, source });
      setUploadHistory(getGeminiUploadHistory());
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleUseHistoryAsContext = (entry: GeminiUploadHistoryEntry) => {
    setAiContextByFormat(entry.format, entry.content, `history:${entry.name}`);
    setIncludeContext(true);
    setPersistentValue('gemini_include_context', true);
    const updated = { ...includeContextFormats, [entry.format]: true };
    setIncludeContextFormats(updated);
    setPersistentValue('gemini_include_context_formats', updated);
  };

  const handleCreatePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const now = Date.now();
    const created: PromptPreset = {
      id: crypto.randomUUID(),
      name,
      systemPrompt,
      customPrompt,
      createdAt: now,
      updatedAt: now
    };
    const next = [created, ...promptPresets];
    savePresetList(next);
    setSelectedPresetId(created.id);
  };

  const handleUpdatePreset = () => {
    if (!selectedPreset) return;
    const name = presetName.trim() || selectedPreset.name;
    const next = promptPresets.map((item) =>
      item.id === selectedPreset.id
        ? { ...item, name, systemPrompt, customPrompt, updatedAt: Date.now() }
        : item
    );
    savePresetList(next);
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) return;
    const next = promptPresets.filter((item) => item.id !== selectedPreset.id);
    savePresetList(next);
    setSelectedPresetId('');
    setPresetName('');
  };

  const handleSelectPreset = (preset: PromptPreset) => {
    setSelectedPresetId(preset.id);
    setPresetName(preset.name);
    savePrompts(preset.systemPrompt, preset.customPrompt);
  };

  const handleToggleContext = (checked: boolean) => {
    setIncludeContext(checked);
    setPersistentValue('gemini_include_context', checked);
  };

  const handleToggleContextFormat = (format: ContextFormat, checked: boolean) => {
    const updated = { ...includeContextFormats, [format]: checked };
    setIncludeContextFormats(updated);
    setPersistentValue('gemini_include_context_formats', updated);
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    if (!confirm('Clear all conversation history?')) return;
    setMessages([]);
    setPersistentValue('gemini_messages', []);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskGemini();
    }
  };

  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_360px] gap-4">
      <aside className="bg-surface border border-slate-700 rounded-xl p-3 space-y-3 overflow-auto">
        <div className="text-sm font-semibold text-slate-200">Context</div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => handleToggleContext(e.target.checked)}
            className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
          />
          Include context in request
        </label>

        <div className="space-y-2">
          {(['xml', 'json', 'markdown', 'text'] as ContextFormat[]).map((format) => {
            const content = context[format] || '';
            const meta = context.meta?.[format];
            return (
              <div key={format} className="border border-slate-700 rounded-lg p-2 bg-slate-950/40 space-y-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeContextFormats[format]}
                    onChange={(e) => handleToggleContextFormat(format, e.target.checked)}
                    className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
                  />
                  <span className="font-semibold uppercase">{format}</span>
                </label>
                <div className="text-[11px] text-slate-500">{meta?.source || '(no source)'}</div>
                <div className="text-[11px] text-slate-500">
                  {meta?.updatedAt ? new Date(meta.updatedAt).toLocaleString() : '(no timestamp)'}
                </div>
                <div className="text-[11px] text-slate-400">{content.length} chars</div>
                <pre className="max-h-20 overflow-auto text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded p-2 whitespace-pre-wrap break-all">
                  {content ? content.slice(0, 200) : '(empty)'}
                </pre>
              </div>
            );
          })}
        </div>

        <label className="text-xs bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700 cursor-pointer inline-flex items-center gap-1 w-full justify-center">
          <Upload size={12} />
          Upload xml/json/txt/md
          <input
            type="file"
            accept=".xml,.json,.txt,.md,.markdown,text/plain,application/json,text/markdown,application/xml,text/xml"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {uploadHistory.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Recent uploads</div>
            {uploadHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-2 text-xs border border-slate-700 rounded px-2 py-1">
                <div className="min-w-0">
                  <div className="text-slate-200 truncate">{entry.name}</div>
                  <div className="text-slate-500">{entry.format.toUpperCase()} • {entry.content.length} chars</div>
                </div>
                <button
                  onClick={() => handleUseHistoryAsContext(entry)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <section className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col min-h-[72vh]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Gemini Data Expert</h2>
            <p className="text-slate-400 text-sm">Wider chat viewport for longer conversations</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear history"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto space-y-4 min-h-[460px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
              <Sparkles size={48} className="text-slate-700" />
              <div className="text-center">
                <p className="mb-2">Start a conversation about your data</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    'Generate TypeScript interface from JSON',
                    'Create XSD schema for this XML',
                    'Convert JSON to Markdown table',
                    'Explain this data structure'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="text-xs bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`
                    max-w-[86%] rounded-lg p-4 relative group
                    ${message.role === 'user'
                      ? 'bg-primary/20 border border-primary/30 text-slate-200'
                      : 'bg-slate-900/60 border border-slate-700/60 text-slate-200'
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap text-sm font-mono">{message.content}</div>
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-1 rounded transition-opacity"
                  >
                    {copied === index ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <div className="text-[10px] text-slate-600 mt-2">{new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you need... (Shift+Enter for new line)"
            className="flex-1 bg-editor border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-primary outline-none resize-none h-24"
            disabled={loading}
          />
          <Button
            onClick={handleAskGemini}
            disabled={loading || !input.trim()}
            className="h-auto border-none px-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : <MessageSquare />}
          </Button>
        </div>
      </section>

      <aside className="bg-surface border border-slate-700 rounded-xl p-3 space-y-3 overflow-auto">
        <div className="text-sm font-semibold text-slate-200">Prompts</div>
        <div>
          <div className="text-xs text-slate-300 mb-1">System Prompt</div>
          <textarea
            value={systemPrompt}
            onChange={(e) => savePrompts(e.target.value, customPrompt)}
            className="w-full h-36 bg-editor border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none"
          />
        </div>
        <div>
          <div className="text-xs text-slate-300 mb-1">Custom Prompt</div>
          <textarea
            value={customPrompt}
            onChange={(e) => savePrompts(systemPrompt, e.target.value)}
            placeholder="Extra rules for this workspace."
            className="w-full h-24 bg-editor border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none"
          />
        </div>

        <div className="border-t border-slate-700 pt-3 space-y-2">
          <div className="text-xs text-slate-300">Prompt Presets (CRUD)</div>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            className="w-full bg-editor border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreatePreset}
              className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white inline-flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Create
            </button>
            <button
              onClick={handleUpdatePreset}
              disabled={!selectedPreset}
              className="flex-1 text-xs px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 inline-flex items-center justify-center gap-1"
            >
              <Save size={12} /> Update
            </button>
            <button
              onClick={handleDeletePreset}
              disabled={!selectedPreset}
              className="flex-1 text-xs px-2 py-1.5 rounded bg-red-900/30 border border-red-700 text-red-300 hover:text-red-200 disabled:opacity-40 inline-flex items-center justify-center gap-1"
            >
              <X size={12} /> Delete
            </button>
          </div>
          <div className="space-y-1 max-h-56 overflow-auto">
            {promptPresets.length === 0 && (
              <div className="text-[11px] text-slate-500">No presets yet.</div>
            )}
            {promptPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`
                  w-full text-left rounded border px-2 py-1.5 text-xs
                  ${selectedPresetId === preset.id
                    ? 'border-primary/50 bg-primary/10 text-slate-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{preset.name}</span>
                  <Pencil size={11} />
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(preset.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
