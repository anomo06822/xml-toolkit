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
  geminiToken: string;
  geminiModel: GeminiModel;
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
  geminiToken: '',
  geminiModel: DEFAULT_GEMINI_MODEL
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return defaultSettings;
  }
};

export const updateSettings = (updates: Partial<AppSettings>): AppSettings => {
  const current = getSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

export const resetSettings = (): AppSettings => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
};

export const getGeminiToken = (): string => {
  const settingsToken = getSettings().geminiToken?.trim();
  if (settingsToken) {
    return settingsToken;
  }

  const env = (import.meta as any).env || {};
  return env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
};

export const getGeminiModel = (): GeminiModel => {
  return resolveGeminiModel(getSettings().geminiModel);
};

export const toTokenPreview = (token: string): string => {
  const normalized = token.trim();
  if (!normalized) return '(missing)';
  if (normalized.length <= 10) {
    return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
  }
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
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
  tokenPreview: string;
  requestBody: string;
  responseBody?: string;
  error?: string;
  success: boolean;
}

const MAX_GEMINI_API_LOGS = 100;

export const getGeminiApiLogs = (): GeminiApiLogEntry[] => {
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
  const logs = getGeminiApiLogs();
  const newLog: GeminiApiLogEntry = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };

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
    if (key.startsWith(STORAGE_PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
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
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
    
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
};
