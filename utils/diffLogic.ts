import { DiffResult } from '../types';

export const computeDiff = (oldText: string, newText: string): DiffResult[] => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Very naive diff implementation for demonstration
  // Real-world would use 'diff-match-patch' or similar
  // This just highlights simple additions/removals/matches line-by-line 
  // until length mismatch, effectively just showing side-by-side structure changes roughly.
  // For a "World Class" app without external libs, we simulate a basic diff visually.
  
  const diffs: DiffResult[] = [];
  
  let i = 0;
  let j = 0;
  
  while(i < oldLines.length || j < newLines.length) {
     const oldLine = oldLines[i];
     const newLine = newLines[j];
     
     if (oldLine === newLine) {
         diffs.push({ added: false, removed: false, value: oldLine || '' });
         i++;
         j++;
     } else if (oldLine && !newLine) {
         diffs.push({ added: false, removed: true, value: oldLine });
         i++;
     } else if (!oldLine && newLine) {
         diffs.push({ added: true, removed: false, value: newLine });
         j++;
     } else {
         // Both exist but differ
         // Naive: Mark old as removed, new as added
         diffs.push({ added: false, removed: true, value: oldLine });
         diffs.push({ added: true, removed: false, value: newLine });
         i++;
         j++;
     }
  }
  
  return diffs;
};
