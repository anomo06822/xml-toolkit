import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/Button';
import {
  formatShortcut,
  generateGeminiContent,
  getGeminiModel,
  getPersistentValue,
  isPrimaryShortcut,
  setPersistentValue
} from '../services';
import { Languages, Volume2, ArrowLeftRight, Loader2, Copy, Check, Wand2 } from 'lucide-react';

type Lang = 'en' | 'zh-TW';

interface DictionaryInfo {
  ipa?: string;
  audioUrl?: string;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

interface TranslateHistoryItem {
  id: string;
  timestamp: number;
  sourceLang: Lang;
  targetLang: Lang;
  input: string;
  output: string;
}

const HISTORY_KEY = 'translate_history';
const MAX_HISTORY = 30;
const DEFAULT_OPTIMIZE_PROMPT = 'Polish the following English text for clarity and naturalness while preserving meaning. Return only the improved English text.';

export const TranslatePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<Lang>('en');
  const [targetLang, setTargetLang] = useState<Lang>('zh-TW');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [optimizedEnglish, setOptimizedEnglish] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dict, setDict] = useState<DictionaryInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(() =>
    getPersistentValue<boolean>('translate_auto_enabled', true)
  );
  const [optimizePrompt, setOptimizePrompt] = useState<string>(() =>
    getPersistentValue<string>('translate_optimize_prompt', DEFAULT_OPTIMIZE_PROMPT)
  );
  const [history, setHistory] = useState<TranslateHistoryItem[]>(() =>
    getPersistentValue<TranslateHistoryItem[]>(HISTORY_KEY, [])
  );
  const lastAutoRequestKeyRef = useRef<string>('');

  const isSingleEnglishWord = useMemo(
    () => /^[A-Za-z-]+$/.test(input.trim()) && input.trim().split(/\s+/).length === 1,
    [input]
  );

  const pushHistory = useCallback((item: Omit<TranslateHistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      const next: TranslateHistoryItem[] = [
        { ...item, id: crypto.randomUUID(), timestamp: Date.now() },
        ...prev
      ].slice(0, MAX_HISTORY);
      setPersistentValue(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const loadDictionary = async (word: string) => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return;
      const data = await res.json();
      const phonetics = data?.[0]?.phonetics || [];
      const best = phonetics.find((p: any) => p?.text || p?.audio) || {};
      const meanings = (data?.[0]?.meanings || []).map((meaning: any) => ({
        partOfSpeech: meaning?.partOfSpeech || 'unknown',
        definitions: (meaning?.definitions || []).slice(0, 3).map((def: any) => ({
          definition: def?.definition || '',
          example: def?.example
        }))
      }));
      setDict({
        ipa: best?.text || data?.[0]?.phonetic,
        audioUrl: best?.audio || undefined,
        meanings
      });
    } catch {
      // no-op
    }
  };

  const translateWithGoogle = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setDict(null);

    try {
      const url = new URL('https://translate.googleapis.com/translate_a/single');
      url.searchParams.set('client', 'gtx');
      url.searchParams.set('sl', sourceLang);
      url.searchParams.set('tl', targetLang);
      url.searchParams.set('dt', 't');
      url.searchParams.set('q', input);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Translate request failed (${res.status})`);

      const data = await res.json();
      const translated = (data?.[0] || []).map((part: any[]) => part?.[0] || '').join('');
      setOutput(translated || '');
      pushHistory({ sourceLang, targetLang, input, output: translated || '' });

      if ((sourceLang === 'en' || targetLang === 'en') && isSingleEnglishWord) {
        const word = sourceLang === 'en' ? input.trim().toLowerCase() : translated.trim().toLowerCase();
        if (/^[a-z-]+$/.test(word)) {
          await loadDictionary(word);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Translate failed');
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [input, isSingleEnglishWord, pushHistory, sourceLang, targetLang]);

  const optimizeEnglishWithGemini = async () => {
    if (!input.trim()) return;
    if (sourceLang !== 'en') {
      setError('English optimization requires source language = English.');
      return;
    }

    setOptimizing(true);
    setError(null);
    try {
      const model = getGeminiModel();
      const prompt = `${optimizePrompt.trim() || DEFAULT_OPTIMIZE_PROMPT}

Text:
${input}`;
      const result = await generateGeminiContent({ model, contents: prompt });
      const improved = (result.text || '').trim();
      if (improved) {
        setOptimizedEnglish(improved);
      }
    } catch (e: any) {
      setError(e?.message || 'Gemini optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const swapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInput(output);
    setOutput(input);
    setDict(null);
  };

  const handleToggleAutoTranslate = (checked: boolean) => {
    setAutoTranslate(checked);
    setPersistentValue('translate_auto_enabled', checked);
  };

  const handleOptimizePromptChange = (value: string) => {
    setOptimizePrompt(value);
    setPersistentValue('translate_optimize_prompt', value);
  };

  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (!autoTranslate) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const key = `${sourceLang}|${targetLang}|${trimmed}`;
    if (lastAutoRequestKeyRef.current === key) return;

    const timer = window.setTimeout(() => {
      lastAutoRequestKeyRef.current = key;
      void translateWithGoogle();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoTranslate, input, sourceLang, targetLang, translateWithGoogle]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPrimaryShortcut(e)) return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void translateWithGoogle();
      }
      if (e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        swapLangs();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyOutput();
      }
      if (e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        void optimizeEnglishWithGemini();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [output, translateWithGoogle]);

  return (
    <div className="w-full h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
      <div className="flex flex-col gap-4 min-h-0">
        <div className="bg-surface border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Languages size={20} className="text-primary" />
            Google Translate (EN ↔ 繁體中文)
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={swapLangs} icon={<ArrowLeftRight size={14} />}>
              Swap ({formatShortcut('S', true)})
            </Button>
            <Button
              variant="secondary"
              onClick={optimizeEnglishWithGemini}
              disabled={optimizing || sourceLang !== 'en' || !input.trim()}
              icon={optimizing ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
            >
              Optimize EN ({formatShortcut('E', true)})
            </Button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-400 px-1">
          <input
            type="checkbox"
            checked={autoTranslate}
            onChange={(e) => handleToggleAutoTranslate(e.target.checked)}
            className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
          />
          Auto translate after 500ms
        </label>

        <div className="bg-surface border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
          <div className="text-xs text-slate-400">Optimize EN Prompt</div>
          <textarea
            value={optimizePrompt}
            onChange={(e) => handleOptimizePromptChange(e.target.value)}
            className="bg-editor border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none h-20"
          />
        </div>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="bg-surface border border-slate-700 rounded-lg p-3 flex flex-col gap-2 min-h-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Source</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value as Lang)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="en">English</option>
                <option value="zh-TW">繁體中文</option>
              </select>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type English or Traditional Chinese... (auto translate in 500ms)"
              className="flex-1 bg-editor border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none resize-none"
            />
          </div>

          <div className="bg-surface border border-slate-700 rounded-lg p-3 flex flex-col gap-2 min-h-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Target</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as Lang)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="zh-TW">繁體中文</option>
                <option value="en">English</option>
              </select>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Translation output..."
              className="flex-1 bg-editor border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none resize-none"
            />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={copyOutput} disabled={!output} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                {copied ? 'Copied!' : `Copy (${formatShortcut('C', true)})`}
              </Button>
            </div>
          </div>
        </div>

        {(dict?.ipa || dict?.audioUrl) && (
          <div className="bg-surface border border-slate-700 rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">IPA:</span>
              <code className="text-accent">{dict.ipa || '(not found)'}</code>
            </div>
            {dict.audioUrl ? (
              <div className="w-full md:w-auto">
                <audio controls src={dict.audioUrl} className="w-full md:w-72" />
              </div>
            ) : (
              <Volume2 size={14} className="text-slate-500" />
            )}
          </div>
        )}

        {dict?.meanings && dict.meanings.length > 0 && (
          <div className="bg-surface border border-slate-700 rounded-lg p-3 space-y-3">
            <div className="text-sm text-slate-300">Meanings</div>
            {dict.meanings.map((meaning, idx) => (
              <div key={`${meaning.partOfSpeech}-${idx}`} className="space-y-1">
                <div className="text-xs text-slate-400 uppercase">{meaning.partOfSpeech}</div>
                <ul className="text-sm text-slate-200 list-disc pl-5 space-y-1">
                  {meaning.definitions.map((def, defIndex) => (
                    <li key={`${idx}-${defIndex}`}>
                      <span>{def.definition}</span>
                      {def.example && (
                        <div className="text-xs text-slate-400 mt-1">Example: {def.example}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {optimizedEnglish && (
          <div className="bg-surface border border-slate-700 rounded-lg p-3 space-y-2">
            <div className="text-sm text-slate-300">Optimized English</div>
            <textarea
              value={optimizedEnglish}
              readOnly
              className="w-full h-28 bg-editor border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none resize-none"
            />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setInput(optimizedEnglish)}>
                Apply to Source
              </Button>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex justify-end">
          <Button onClick={translateWithGoogle} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : `Translate (${formatShortcut('Enter')})`}
          </Button>
        </div>
      </div>

      <aside className="bg-surface border border-slate-700 rounded-lg p-3 min-h-0 overflow-auto">
        <div className="text-sm font-medium text-slate-200 mb-2">History</div>
        <div className="space-y-2">
          {history.length === 0 && <div className="text-xs text-slate-500">No history yet.</div>}
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSourceLang(item.sourceLang);
                setTargetLang(item.targetLang);
                setInput(item.input);
                setOutput(item.output);
              }}
              className="w-full text-left border border-slate-700 rounded p-2 bg-slate-900/40 hover:bg-slate-800/40"
            >
              <div className="text-[11px] text-slate-500">
                {item.sourceLang} → {item.targetLang} • {new Date(item.timestamp).toLocaleString()}
              </div>
              <div className="text-xs text-slate-300 truncate">{item.input}</div>
              <div className="text-xs text-accent truncate">{item.output}</div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
};
