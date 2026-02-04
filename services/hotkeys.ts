export const isMacPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
};

export const getModKeyLabel = (): string => (isMacPlatform() ? '⌘' : 'Ctrl');

export const formatShortcut = (key: string, withShift = false): string => {
  const mod = getModKeyLabel();
  const shift = withShift ? (isMacPlatform() ? '⇧' : 'Shift+') : '';
  return `${mod}+${shift}${key}`;
};

export const isPrimaryShortcut = (e: KeyboardEvent): boolean =>
  (isMacPlatform() ? e.metaKey : e.ctrlKey) && !e.altKey;
