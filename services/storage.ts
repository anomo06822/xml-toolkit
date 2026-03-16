// ============================================
// Storage Service - User Data Persistence
// ============================================

import { SavedTemplate, WorkspaceData, DataFormat } from '../core';

const STORAGE_PREFIX = 'datatoolkit_';
const TEMPLATES_KEY = `${STORAGE_PREFIX}templates`;
const WORKSPACES_KEY = `${STORAGE_PREFIX}workspaces`;
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
const HISTORY_KEY = `${STORAGE_PREFIX}history`;
const GEMINI_API_LOGS_KEY = `${STORAGE_PREFIX}gemini_api_logs`;
const AI_CONTEXT_KEY = `${STORAGE_PREFIX}ai_context`;
const GEMINI_UPLOAD_HISTORY_KEY = `${STORAGE_PREFIX}gemini_upload_history`;
const DEPRECATED_STORAGE_KEYS = [
  `${STORAGE_PREFIX}translate_auto_enabled`,
  `${STORAGE_PREFIX}translate_optimize_prompt`,
  `${STORAGE_PREFIX}translate_history`
];
const AI_SENSITIVE_EXPORT_KEYS = new Set([
  GEMINI_API_LOGS_KEY,
  AI_CONTEXT_KEY,
  GEMINI_UPLOAD_HISTORY_KEY,
  `${STORAGE_PREFIX}gemini_messages`,
  `${STORAGE_PREFIX}gemini_include_context`,
  `${STORAGE_PREFIX}gemini_include_context_formats`,
  `${STORAGE_PREFIX}gemini_system_prompt`,
  `${STORAGE_PREFIX}gemini_custom_prompt`,
  `${STORAGE_PREFIX}gemini_prompt_presets`
]);

const purgeDeprecatedStorageKeys = () => {
  DEPRECATED_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};

// ============================================
// Templates Management
// ============================================

export const getTemplates = (): SavedTemplate[] => {
  try {
    const data = localStorage.getItem(TEMPLATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load templates:', e);
    return [];
  }
};

export const saveTemplate = (template: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>): SavedTemplate => {
  const templates = getTemplates();
  
  const newTemplate: SavedTemplate = {
    ...template,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  templates.push(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  
  return newTemplate;
};

export const updateTemplate = (id: string, updates: Partial<SavedTemplate>): SavedTemplate | null => {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: Date.now()
  };
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return templates[index];
};

export const deleteTemplate = (id: string): boolean => {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length === templates.length) return false;
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  return true;
};

export const getTemplatesByFormat = (format: DataFormat): SavedTemplate[] => {
  return getTemplates().filter(t => t.format === format);
};

export const searchTemplates = (query: string): SavedTemplate[] => {
  const q = query.toLowerCase();
  return getTemplates().filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.content.toLowerCase().includes(q) ||
    t.description?.toLowerCase().includes(q) ||
    t.tags?.some(tag => tag.toLowerCase().includes(q))
  );
};

// ============================================
// Workspaces Management
// ============================================

export const getWorkspaces = (): WorkspaceData[] => {
  try {
    const data = localStorage.getItem(WORKSPACES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load workspaces:', e);
    return [];
  }
};

export const saveWorkspace = (workspace: Omit<WorkspaceData, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceData => {
  const workspaces = getWorkspaces();
  
  const newWorkspace: WorkspaceData = {
    ...workspace,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  workspaces.push(newWorkspace);
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
  
  return newWorkspace;
};

export const updateWorkspace = (id: string, updates: Partial<WorkspaceData>): WorkspaceData | null => {
  const workspaces = getWorkspaces();
  const index = workspaces.findIndex(w => w.id === id);
  
  if (index === -1) return null;
  
  workspaces[index] = {
    ...workspaces[index],
    ...updates,
    updatedAt: Date.now()
  };
  
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
  return workspaces[index];
};

export const deleteWorkspace = (id: string): boolean => {
  const workspaces = getWorkspaces();
  const filtered = workspaces.filter(w => w.id !== id);
  
  if (filtered.length === workspaces.length) return false;
  
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(filtered));
  return true;
};

// ============================================
// Settings
// ============================================

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultFormat: DataFormat;
  indentSize: number;
  indentChar: 'space' | 'tab';
  autoDetectFormat: boolean;
  autoFormat: boolean;
  fontSize: number;
  showLineNumbers: boolean;
  geminiModel: GeminiModel;
  persistAiLogs: boolean;
  globalWakeupShortcut: string;
}

export const GEMINI_MODEL_OPTIONS = [
  { label: 'Gemini 3 Pro', value: 'gemini-3-pro' },
  { label: 'Gemini 3 Flash', value: 'gemini-3-flash' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Flash-Lite', value: 'gemini-2.5-flash-lite' }
] as const;

export const GEMINI_MODELS = GEMINI_MODEL_OPTIONS.map((option) => option.value) as readonly string[];

export type GeminiModel = typeof GEMINI_MODEL_OPTIONS[number]['value'];

const DEFAULT_GEMINI_MODEL: GeminiModel = 'gemini-2.5-flash';

const resolveGeminiModel = (model?: string): GeminiModel => {
  if (!model) {
    return DEFAULT_GEMINI_MODEL;
  }
  return GEMINI_MODELS.includes(model as GeminiModel)
    ? (model as GeminiModel)
    : DEFAULT_GEMINI_MODEL;
};

const defaultSettings: AppSettings = {
  theme: 'dark',
  defaultFormat: 'json',
  indentSize: 2,
  indentChar: 'space',
  autoDetectFormat: true,
  autoFormat: false,
  fontSize: 14,
  showLineNumbers: true,
  geminiModel: DEFAULT_GEMINI_MODEL,
  persistAiLogs: false,
  globalWakeupShortcut: 'CommandOrControl+Shift+Space'
};

const sanitizeSettingsPayload = (value: unknown): Partial<AppSettings> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const { geminiToken: _legacyGeminiToken, ...rest } = value as Record<string, unknown>;
  const sanitized = rest as Partial<AppSettings>;
  if ('persistAiLogs' in sanitized && typeof sanitized.persistAiLogs !== 'boolean') {
    delete sanitized.persistAiLogs;
  }
  return sanitized;
};

const pruneAiSensitiveLocalData = (settings: AppSettings) => {
  if (!settings.persistAiLogs) {
    localStorage.removeItem(GEMINI_API_LOGS_KEY);
  }
};

export const getSettings = (): AppSettings => {
  try {
    purgeDeprecatedStorageKeys();
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return defaultSettings;
    }

    const parsed = JSON.parse(data);
    const sanitized = sanitizeSettingsPayload(parsed);

    const resolvedSettings = { ...defaultSettings, ...sanitized };

    if (
      parsed && typeof parsed === 'object' && (
        'geminiToken' in parsed ||
        !('persistAiLogs' in (parsed as Record<string, unknown>))
      )
    ) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(resolvedSettings));
    }

    pruneAiSensitiveLocalData(resolvedSettings);
    return resolvedSettings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return defaultSettings;
  }
};

export const updateSettings = (updates: Partial<AppSettings>): AppSettings => {
  const current = getSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  pruneAiSensitiveLocalData(updated);
  return updated;
};

export const resetSettings = (): AppSettings => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  pruneAiSensitiveLocalData(defaultSettings);
  return defaultSettings;
};

export const getGeminiModel = (): GeminiModel => {
  return resolveGeminiModel(getSettings().geminiModel);
};

// ============================================
// History (for undo/clipboard history)
// ============================================

export interface HistoryEntry {
  id: string;
  content: string;
  format: DataFormat;
  operation: string;
  timestamp: number;
}

const MAX_HISTORY = 50;

export const getHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
};

export const addToHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry => {
  const history = getHistory();
  
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  
  // Add to beginning, limit size
  history.unshift(newEntry);
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return newEntry;
};

export const clearHistory = (): void => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
};

// ============================================
// Gemini API Logs
// ============================================

export interface GeminiApiLogEntry {
  id: string;
  timestamp: number;
  source: 'assistant' | 'diff-summary';
  model: GeminiModel;
  provider: 'electron-backend' | 'http-backend' | 'unknown';
  requestBody: string;
  responseBody?: string;
  error?: string;
  success: boolean;
}

const MAX_GEMINI_API_LOGS = 100;

export const getGeminiApiLogs = (): GeminiApiLogEntry[] => {
  if (!getSettings().persistAiLogs) {
    localStorage.removeItem(GEMINI_API_LOGS_KEY);
    return [];
  }

  try {
    const data = localStorage.getItem(GEMINI_API_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load Gemini API logs:', e);
    return [];
  }
};

export const addGeminiApiLog = (
  log: Omit<GeminiApiLogEntry, 'id' | 'timestamp'>
): GeminiApiLogEntry => {
  const persistAiLogs = getSettings().persistAiLogs;
  const logs = getGeminiApiLogs();
  const newLog: GeminiApiLogEntry = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };

  if (!persistAiLogs) {
    return newLog;
  }

  logs.unshift(newLog);
  if (logs.length > MAX_GEMINI_API_LOGS) {
    logs.pop();
  }

  localStorage.setItem(GEMINI_API_LOGS_KEY, JSON.stringify(logs));
  return newLog;
};

export const clearGeminiApiLogs = (): void => {
  localStorage.setItem(GEMINI_API_LOGS_KEY, JSON.stringify([]));
};

// ============================================
// AI Context
// ============================================

export interface AiContextState {
  xml?: string;
  json?: string;
  markdown?: string;
  text?: string;
  source?: string;
  updatedAt?: number;
  meta?: Partial<Record<DataFormat | 'text', { source?: string; updatedAt?: number }>>;
}

const normalizeContextContent = (content: string): string => content.trim();

export const getAiContext = (): AiContextState => {
  try {
    const data = localStorage.getItem(AI_CONTEXT_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to load AI context:', e);
    return {};
  }
};

export const setAiContextByFormat = (
  format: DataFormat | 'text',
  content: string,
  source?: string
): AiContextState => {
  const current = getAiContext();
  const normalizedContent = normalizeContextContent(content);
  const updated: AiContextState = {
    ...current,
    [format]: normalizedContent,
    source: source || current.source,
    updatedAt: Date.now(),
    meta: {
      ...(current.meta || {}),
      [format]: {
        source: source || current.meta?.[format]?.source,
        updatedAt: Date.now()
      }
    }
  };
  localStorage.setItem(AI_CONTEXT_KEY, JSON.stringify(updated));
  return updated;
};

export interface GeminiUploadHistoryEntry {
  id: string;
  name: string;
  format: DataFormat | 'text';
  content: string;
  uploadedAt: number;
  source: string;
}

const MAX_GEMINI_UPLOAD_HISTORY = 10;

export const getGeminiUploadHistory = (): GeminiUploadHistoryEntry[] => {
  try {
    const data = localStorage.getItem(GEMINI_UPLOAD_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load Gemini upload history:', e);
    return [];
  }
};

export const addGeminiUploadHistory = (
  entry: Omit<GeminiUploadHistoryEntry, 'id' | 'uploadedAt'>
): GeminiUploadHistoryEntry => {
  const history = getGeminiUploadHistory();
  const item: GeminiUploadHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    uploadedAt: Date.now()
  };
  history.unshift(item);
  if (history.length > MAX_GEMINI_UPLOAD_HISTORY) {
    history.length = MAX_GEMINI_UPLOAD_HISTORY;
  }
  localStorage.setItem(GEMINI_UPLOAD_HISTORY_KEY, JSON.stringify(history));
  return item;
};

// ============================================
// Persistent State Hook
// ============================================

export const getPersistentValue = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Failed to read ${key}:`, e);
    return defaultValue;
  }
};

export const setPersistentValue = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}:`, e);
  }
};

// ============================================
// Clear All Data
// ============================================

export const clearAllData = (): void => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

export const exportAllData = (): string => {
  const data: Record<string, any> = {};
  
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX) && !AI_SENSITIVE_EXPORT_KEYS.has(key)) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '');
        data[key] = key === SETTINGS_KEY ? sanitizeSettingsPayload(parsed) : parsed;
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  });
  
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonStr: string): boolean => {
  try {
    const data = JSON.parse(jsonStr);
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(STORAGE_PREFIX) && !AI_SENSITIVE_EXPORT_KEYS.has(key)) {
        const sanitizedValue = key === SETTINGS_KEY ? sanitizeSettingsPayload(value) : value;
        localStorage.setItem(key, JSON.stringify(sanitizedValue));
      }
    }
    
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
};
