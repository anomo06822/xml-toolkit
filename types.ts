export enum AppTab {
  CONVERTER = 'converter',
  TREE = 'tree',
  SORTER = 'sorter',
  DIFF = 'diff',
  MINIFIER = 'minifier',
  AI = 'ai'
}

export interface HotkeyConfig {
  key: string;
  description: string;
  action: () => void;
  modifier?: 'ctrl' | 'shift' | 'alt' | 'meta'; // 'meta' is cmd on mac
}

export interface XmlNode {
  tagName: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  textContent: string | null;
  id: string; // Internal ID for keys
}

export interface DiffResult {
  added: boolean;
  removed: boolean;
  value: string;
}