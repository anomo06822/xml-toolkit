import React, { useState } from 'react';
import { parseXmlString, serializeXml, sortXmlNodes, formatXml } from '../utils/xmlProcessing';
import { usePersistentState } from '../hooks/usePersistentState';
import { Button } from '../components/Button';
import { ArrowDownAZ } from 'lucide-react';

export const Sorter: React.FC = () => {
  const [input, setInput] = usePersistentState<string>('sorter_input', '<root>\n  <zebra>Value</zebra>\n  <apple>Value</apple>\n  <mango>Value</mango>\n</root>');
  const [output, setOutput] = useState('');

  const handleSort = () => {
    try {
      const doc = parseXmlString(input);
      sortXmlNodes(doc.documentElement);
      const raw = serializeXml(doc);
      setOutput(formatXml(raw));
    } catch (e) {
      alert("Invalid XML");
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-100">Alphabetical Node Sorter</h2>
        <Button onClick={handleSort} icon={<ArrowDownAZ size={16} />}>Sort Nodes</Button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-2 h-full">
          <label className="text-sm font-medium text-slate-400">Original XML</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 w-full bg-surface border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 resize-none focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex flex-col gap-2 h-full">
          <label className="text-sm font-medium text-slate-400">Sorted XML</label>
          <textarea
            readOnly
            value={output}
            placeholder="Sorted output will appear here..."
            className="flex-1 w-full bg-[#162032] border border-slate-700 rounded-lg p-4 font-mono text-sm text-blue-300 resize-none outline-none"
          />
        </div>
      </div>
    </div>
  );
};