import React, { useState } from 'react';
import { parseXmlString, serializeXml, sortXmlNodes, formatXml } from '../utils/xmlProcessing';
import { computeDiff } from '../utils/diffLogic';
import { usePersistentState } from '../hooks/usePersistentState';
import { Button } from '../components/Button';
import { GitCompare, Settings2 } from 'lucide-react';

export const Differ: React.FC = () => {
  const [leftXml, setLeftXml] = usePersistentState<string>('differ_left', '<root>\n  <item>A</item>\n  <item>B</item>\n</root>');
  const [rightXml, setRightXml] = usePersistentState<string>('differ_right', '<root>\n  <item>B</item>\n  <item>C</item>\n</root>');
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [normalize, setNormalize] = useState(true);

  const handleCompare = () => {
    try {
      let lStr = leftXml;
      let rStr = rightXml;

      if (normalize) {
        const doc1 = parseXmlString(leftXml);
        const doc2 = parseXmlString(rightXml);
        sortXmlNodes(doc1.documentElement);
        sortXmlNodes(doc2.documentElement);
        lStr = formatXml(serializeXml(doc1));
        rStr = formatXml(serializeXml(doc2));
      }

      setDiffResult(computeDiff(lStr, rStr));
    } catch (e) {
      alert("Error parsing XMLs for comparison");
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-100">XML Diff</h2>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500 transition-colors">
            <input 
              type="checkbox" 
              checked={normalize} 
              onChange={e => setNormalize(e.target.checked)}
              className="rounded border-slate-600 text-primary focus:ring-primary bg-slate-800"
            />
            <Settings2 size={14} />
            Normalize Order (Sort before Diff)
          </label>
        </div>
        <Button onClick={handleCompare} icon={<GitCompare size={16} />}>Compare Documents</Button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-4">
           <textarea 
             value={leftXml} 
             onChange={e => setLeftXml(e.target.value)}
             className="h-1/3 bg-surface border border-slate-700 rounded-lg p-2 font-mono text-xs text-slate-300 resize-none"
             placeholder="Source XML"
           />
           <textarea 
             value={rightXml} 
             onChange={e => setRightXml(e.target.value)}
             className="h-1/3 bg-surface border border-slate-700 rounded-lg p-2 font-mono text-xs text-slate-300 resize-none"
             placeholder="Target XML"
           />
        </div>

        <div className="h-full bg-[#162032] border border-slate-700 rounded-lg overflow-auto p-4 font-mono text-sm">
           {diffResult.length === 0 ? (
             <div className="text-slate-500 text-center mt-20">Click Compare to see differences</div>
           ) : (
             diffResult.map((line, idx) => (
               <div key={idx} className={`
                 px-2 whitespace-pre-wrap border-l-2
                 ${line.added ? 'bg-green-900/20 border-green-500 text-green-200' : ''}
                 ${line.removed ? 'bg-red-900/20 border-red-500 text-red-200' : ''}
                 ${!line.added && !line.removed ? 'border-transparent text-slate-400' : ''}
               `}>
                 <span className="inline-block w-6 select-none opacity-50">{idx + 1}</span>
                 {line.removed && '- '}{line.added && '+ '}{!line.added && !line.removed && '  '}
                 {line.value}
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};