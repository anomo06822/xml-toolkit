import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getPersistentValue, setPersistentValue } from '../services/storage';
import { Button } from '../components/Button';
import { Sparkles, MessageSquare, Loader2, Copy, Check, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const GeminiAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => 
    getPersistentValue<Message[]>('gemini_messages', [])
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const handleAskGemini = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const systemPrompt = `You are an expert in data formats including XML, JSON, and Markdown. 
You help users with:
- Schema generation (XSD, JSON Schema)
- Format conversion and transformation
- XSLT creation
- Data structure analysis
- TypeScript/JavaScript interface generation
- Validation and error fixing
- Best practices and optimization

Provide clear, concise, and practical answers. Include code examples when relevant.`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser: ${input}`,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.text || 'No response generated.',
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);
      setPersistentValue('gemini_messages', newMessages);
      
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${e.message}\n\nMake sure GEMINI_API_KEY is configured in your .env file.`,
        timestamp: Date.now()
      };
      
      const newMessages = [...updatedMessages, errorMessage];
      setMessages(newMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear all conversation history?')) {
      setMessages([]);
      setPersistentValue('gemini_messages', []);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskGemini();
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="text-center flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Gemini Data Expert
          </h2>
          <p className="text-slate-400 text-sm">
            Ask about XML, JSON, Markdown • Schema generation • Format conversion • Code generation
          </p>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear history"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-surface border border-slate-700 rounded-xl p-4 flex flex-col gap-4 shadow-xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-auto space-y-4 min-h-[200px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
              <Sparkles size={48} className="text-slate-700" />
              <div className="text-center">
                <p className="mb-2">Start a conversation about your data</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    'Generate TypeScript interface from JSON',
                    'Create XSD schema for this XML',
                    'Convert JSON to Markdown table',
                    'Explain this data structure'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="text-xs bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg p-4 relative group
                    ${message.role === 'user'
                      ? 'bg-primary/20 border border-primary/30 text-slate-200'
                      : 'bg-slate-900/50 border border-slate-700/50 text-slate-200'
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap text-sm font-mono">
                    {message.content}
                  </div>
                  
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-1 rounded transition-opacity"
                  >
                    {copied === index ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  
                  <div className="text-[10px] text-slate-600 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                <Loader2 className="animate-spin text-purple-400" size={20} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you need... (Shift+Enter for new line)"
            className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20"
            disabled={loading}
          />
          <Button 
            onClick={handleAskGemini} 
            disabled={loading || !input.trim()}
            className="h-auto bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none px-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : <MessageSquare />}
          </Button>
        </div>
      </div>
    </div>
  );
};
