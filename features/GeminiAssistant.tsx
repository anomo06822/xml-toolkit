import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { usePersistentState } from '../hooks/usePersistentState';
import { Button } from '../components/Button';
import { Sparkles, MessageSquare, Loader2 } from 'lucide-react';

export const GeminiAssistant: React.FC = () => {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || ''); 
  // Note: In a real environment, we use process.env.API_KEY directly from the build/env.
  // Since we cannot prompt for it in UI as per rules, we assume it might be there, 
  // but if it's missing (empty string), the SDK calls will fail naturally or we can't init.
  // The system prompt says "The API key must be obtained exclusively from the environment variable process.env.API_KEY".
  // So we will just use process.env.API_KEY.

  const [input, setInput] = usePersistentState<string>('gemini_prompt', '');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskGemini = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse('');
    
    try {
      // Initialize Gemini Client
      // Note: As per rules, we assume process.env.API_KEY is available.
      // If the runtime doesn't replace it, this will fail, which is expected behavior for code gen tasks 
      // where the user must configure the env.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const model = ai.models;
      const result = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: input,
      });

      setResponse(result.text || 'No response generated.');
    } catch (e: any) {
      setResponse(`Error: ${e.message}. \n\nMake sure process.env.API_KEY is configured.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Gemini XML Expert
        </h2>
        <p className="text-slate-400">Ask for schema generation, XSLT creation, or structural analysis.</p>
      </div>

      <div className="flex-1 bg-surface border border-slate-700 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex-1 overflow-auto space-y-4 min-h-[200px]">
           {response ? (
             <div className="prose prose-invert max-w-none">
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 whitespace-pre-wrap text-sm text-slate-200">
                 {response}
               </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
               <Sparkles size={48} className="text-slate-700" />
               <p>Enter your XML or question below to start.</p>
             </div>
           )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste XML here and ask: 'Generate a TypeScript interface for this' or 'Explain this structure'..."
            className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
          />
          <Button 
            onClick={handleAskGemini} 
            disabled={loading}
            className="h-auto bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none"
          >
            {loading ? <Loader2 className="animate-spin" /> : <MessageSquare />}
          </Button>
        </div>
      </div>
    </div>
  );
};