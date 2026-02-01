import React, { useState } from 'react';
import { parseXmlString, xmlToJson, formatXml, minifyXml } from '../utils/xmlProcessing';
import { usePersistentState } from '../hooks/usePersistentState';
import { Button } from '../components/Button';
import { ArrowRight, Copy, Check, AlignLeft } from 'lucide-react';

export const XmlConverter: React.FC = () => {
  const [xmlInput, setXmlInput] = usePersistentState<string>('converter_input', '<root>\n  <item id="1">Hello</item>\n</root>');
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError(null);
    try {
      const doc = parseXmlString(xmlInput);
      const json = xmlToJson(doc.documentElement);
      setJsonOutput(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFormat = () => {
    setError(null);
    try {
      // Pre-processing:
      // 1. Replace escaped quotes \" with single quotes ' (Common in log dumps)
      const cleanedQuotes = xmlInput.replace(/\\"/g, "'");

      // 2. Minify removes whitespace-only text nodes and handles literal \n
      const minified = minifyXml(cleanedQuotes);

      // 3. Format re-indents the clean XML
      const formatted = formatXml(minified);
      setXmlInput(formatted);
    } catch (e: any) {
      setError("Formatting failed: " + e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-100">XML to JSON Converter</h2>
        <div className="flex gap-2">
          <Button onClick={handleConvert} icon={<ArrowRight size={16} />}>Convert</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-400">XML Input</label>
            <button 
              onClick={handleFormat}
              className="text-xs flex items-center gap-1 text-primary hover:text-blue-400 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
              title="Clean artifacts (convert \&quot; to '), remove literal \n, and re-indent"
            >
              <AlignLeft size={12} /> Format & Cleanup
            </button>
          </div>
          <textarea
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            className="flex-1 w-full bg-surface border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-slate-400">JSON Output</label>
             {jsonOutput && (
               <button onClick={handleCopy} className="text-xs text-primary hover:text-blue-400 flex items-center gap-1">
                 {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? 'Copied' : 'Copy JSON'}
               </button>
             )}
          </div>
          <div className="flex-1 relative">
            <textarea
              readOnly
              value={jsonOutput}
              className="absolute inset-0 w-full h-full bg-[#162032] border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-400 resize-none outline-none"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};