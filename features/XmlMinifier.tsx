import React, { useState, useEffect } from 'react';
import { minifyXml, formatXml } from '../utils/xmlProcessing';
import { usePersistentState } from '../hooks/usePersistentState';
import { Button } from '../components/Button';
import { Send, Copy, Check, Braces, AlignLeft, FileText, FileCode } from 'lucide-react';

export const XmlMinifier: React.FC = () => {
  const [xmlInput, setXmlInput] = usePersistentState<string>('minifier_input', '<UniversalShipment>\n  <ShipmentId>12345</ShipmentId>\n  <Status>Pending</Status>\n</UniversalShipment>');
  const [jsonTemplate, setJsonTemplate] = usePersistentState<string>('minifier_template', '{\n  "xmlPayload": "{{XML}}",\n  "messageType": "Shipment"\n}');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'raw' | 'json' | 'formatted'>('json');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateOutput();
  }, [xmlInput, jsonTemplate, mode]);

  const generateOutput = () => {
    setError(null);
    try {
      const minified = minifyXml(xmlInput);

      if (mode === 'raw') {
        setOutput(minified);
        return;
      }

      if (mode === 'formatted') {
        // Remove newlines (via minify) then format
        setOutput(formatXml(minified));
        return;
      }

      // JSON Wrap Mode
      const escapedXml = JSON.stringify(minified);
      
      let result = jsonTemplate.replace(/"\{\{XML\}\}"/g, escapedXml);
      
      if (result === jsonTemplate) {
         result = jsonTemplate.replace(/\{\{XML\}\}/g, escapedXml);
      }

      setOutput(result);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFormatInput = () => {
    try {
      const formatted = formatXml(minifyXml(xmlInput));
      setXmlInput(formatted);
    } catch (e: any) {
      setError("Failed to format input: " + e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
           <Send size={20} className="text-primary" />
           XML Tools & API Builder
        </h2>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setMode('formatted')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'formatted' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <AlignLeft size={14} /> Formatted
          </button>
          <button 
            onClick={() => setMode('raw')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'raw' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <FileCode size={14} /> Minified
          </button>
          <button 
            onClick={() => setMode('json')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'json' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Braces size={14} /> JSON Payload
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Left Column: Inputs */}
        <div className="flex flex-col gap-4 min-h-0">
          
          {/* XML Input */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-400">Source XML</label>
              <button 
                onClick={handleFormatInput}
                className="text-xs flex items-center gap-1 text-primary hover:text-blue-400 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                title="Remove newlines and re-indent"
              >
                <AlignLeft size={12} /> Format Input
              </button>
            </div>
            <textarea
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="flex-1 w-full bg-surface border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 resize-none focus:ring-2 focus:ring-primary outline-none"
              placeholder="<root>...</root>"
              spellCheck={false}
            />
          </div>

          {/* Template Input (Only in JSON mode) */}
          {mode === 'json' && (
            <div className="flex flex-col gap-2 h-1/3 min-h-[150px]">
              <div className="flex justify-between items-center">
                 <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Braces size={14} /> JSON Template
                 </label>
                 <span className="text-[10px] text-slate-500">Use <code className="bg-slate-800 px-1 rounded text-accent">{'{{XML}}'}</code> as placeholder</span>
              </div>
              <textarea
                value={jsonTemplate}
                onChange={(e) => setJsonTemplate(e.target.value)}
                className="flex-1 w-full bg-surface border border-slate-700 rounded-lg p-3 font-mono text-xs text-yellow-100/80 resize-none focus:ring-2 focus:ring-primary outline-none"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="flex flex-col gap-2 h-full">
          <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-slate-400">
               {mode === 'json' ? 'Generated Payload' : mode === 'formatted' ? 'Formatted XML' : 'Minified XML'}
             </label>
             {output && (
               <Button size="sm" variant="secondary" onClick={handleCopy} icon={copied ? <Check size={14}/> : <Copy size={14}/>}>
                 {copied ? 'Copied' : 'Copy Result'}
               </Button>
             )}
          </div>
          
          <div className="flex-1 relative">
            <textarea
              readOnly
              value={output}
              className="absolute inset-0 w-full h-full bg-[#162032] border border-slate-700 rounded-lg p-4 font-mono text-sm text-green-400 resize-none outline-none"
            />
          </div>
          
          {error && (
            <div className="text-xs text-red-400 mt-2">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};