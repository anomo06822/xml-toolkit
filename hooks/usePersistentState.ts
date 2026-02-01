import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export const STORAGE_PREFIX = 'xmltoolkit_';

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${prefixedKey}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(prefixedKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error writing localStorage key "${prefixedKey}":`, error);
    }
  }, [prefixedKey, state]);

  return [state, setState];
}

export const clearAppCache = () => {
  if (!window.confirm("Are you sure you want to clear all saved data and reset the application?")) {
    return;
  }
  
  // Clear keys with our prefix
  Object.keys(window.localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX) || key === 'xml_templates') {
       window.localStorage.removeItem(key);
    }
  });
  
  window.location.reload();
};