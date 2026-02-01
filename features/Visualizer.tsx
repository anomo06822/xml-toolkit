import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseXmlString } from '../utils/xmlProcessing';
import { usePersistentState } from '../hooks/usePersistentState';
import { 
  ChevronRight, ChevronDown, Tag, Type, 
  Network, List as ListIcon, Maximize2, Minimize2, 
  ZoomIn, ZoomOut, Move, RotateCcw, Search, X,
  Save, Trash2, FolderOpen
} from 'lucide-react';

// --- Helpers ---

const checkMatch = (node: Element | Text, query: string): boolean => {
  if (!query) return false;
  const q = query.toLowerCase();
  
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.nodeValue || '').toLowerCase().includes(q);
  }
  
  const el = node as Element;
  if (el.tagName.toLowerCase().includes(q)) return true;
  
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name.toLowerCase().includes(q) || attr.value.toLowerCase().includes(q)) return true;
  }
  
  return false;
};

const hasDeepMatch = (node: Node, query: string): boolean => {
  if (!query) return false;
  if (checkMatch(node as Element | Text, query)) return true;
  
  if (node.hasChildNodes()) {
    for (let i = 0; i < node.childNodes.length; i++) {
       if (hasDeepMatch(node.childNodes[i], query)) return true;
    }
  }
  return false;
};

const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  // Escape regex special characters in query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/40 text-yellow-200 font-bold rounded px-0.5">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
};

// --- List View Components ---

const TreeNode: React.FC<{ node: Element | Text; depth: number; defaultOpen: boolean; searchQuery: string }> = ({ node, depth, defaultOpen, searchQuery }) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  // Auto-expand if search matches descendants
  const hasDescendantMatch = useMemo(() => {
    if (!searchQuery) return false;
    if (node.nodeType === Node.TEXT_NODE) return false;
    // Check if any child has a match (recursive check handled by the child components prop propagation, 
    // but here we need to know if WE should open)
    return (Array.from(node.childNodes) as Node[]).some(c => hasDeepMatch(c, searchQuery));
  }, [node, searchQuery]);

  useEffect(() => {
    if (searchQuery && hasDescendantMatch) {
      setExpanded(true);
    } else if (!searchQuery) {
      setExpanded(defaultOpen);
    }
  }, [searchQuery, hasDescendantMatch, defaultOpen]);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue?.trim();
    if (!text) return null;
    return (
      <div 
        className="flex items-center gap-2 py-1 hover:bg-white/5 rounded px-2"
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        <Type size={14} className="text-slate-500 flex-shrink-0" />
        <span className="text-slate-300 font-mono text-sm truncate max-w-md" title={text}>
          "<Highlight text={text} query={searchQuery} />"
        </span>
      </div>
    );
  }

  const element = node as Element;
  const hasVisibleChildren = (Array.from(element.childNodes) as Node[]).some(c => 
    c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.nodeValue?.trim())
  );
  
  const attributes = Array.from(element.attributes) as Attr[];

  return (
    <div>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded px-2 select-none group transition-colors"
        style={{ marginLeft: `${depth * 1.5}rem` }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-slate-500 w-4 flex justify-center">
          {hasVisibleChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        <Tag size={14} className="text-accent flex-shrink-0" />
        <span className="text-blue-400 font-mono text-sm font-semibold">
          <Highlight text={element.tagName} query={searchQuery} />
        </span>
        
        {attributes.length > 0 && (
          <div className="flex gap-2 ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {attributes.map(attr => (
              <span key={attr.name} className="text-xs font-mono text-slate-400">
                <span className="text-slate-500"><Highlight text={attr.name} query={searchQuery} />=</span>
                <span className="text-green-600/80">"<Highlight text={attr.value} query={searchQuery} />"</span>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {expanded && hasVisibleChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {(Array.from(element.childNodes) as Node[]).map((child, idx) => (
            <TreeNode key={idx} node={child as Element | Text} depth={depth + 1} defaultOpen={defaultOpen} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Map View Components ---

const MapNode: React.FC<{ node: Element; defaultOpen: boolean; searchQuery: string }> = ({ node, defaultOpen, searchQuery }) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  
  const isMatch = useMemo(() => checkMatch(node, searchQuery), [node, searchQuery]);
  const hasDescendantMatch = useMemo(() => {
    if (!searchQuery) return false;
    return (Array.from(node.childNodes) as Node[]).some(c => hasDeepMatch(c, searchQuery));
  }, [node, searchQuery]);

  useEffect(() => {
    if (searchQuery && hasDescendantMatch) {
      setExpanded(true);
    } else if (!searchQuery) {
      setExpanded(defaultOpen);
    }
  }, [searchQuery, hasDescendantMatch, defaultOpen]);

  const attributes = Array.from(node.attributes) as Attr[];
  
  const children = (Array.from(node.childNodes) as Node[]).filter(c => 
    c.nodeType === Node.ELEMENT_NODE || (c.nodeType === Node.TEXT_NODE && c.nodeValue?.trim())
  );
  const hasChildren = children.length > 0;

  const textContent = children.length === 1 && children[0].nodeType === Node.TEXT_NODE 
    ? children[0].nodeValue?.trim() 
    : null;

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          relative z-10 flex flex-col items-center p-2 rounded-lg border shadow-lg transition-all duration-200
          ${isMatch ? 'ring-2 ring-accent bg-accent/10 border-accent' : expanded ? 'bg-surface border-blue-500/50' : 'bg-surface/50 border-slate-700'}
          hover:border-blue-400 hover:shadow-blue-900/20 cursor-pointer min-w-[120px]
        `}
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Tag size={12} className={isMatch ? "text-yellow-200" : "text-accent"} />
          <span className={`font-bold font-mono text-sm ${isMatch ? 'text-yellow-100' : 'text-blue-400'}`}>
             {node.tagName}
          </span>
          {hasChildren && !textContent && (
            <span className="text-slate-500 hover:text-white">
               {expanded ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            </span>
          )}
        </div>
        
        {textContent && (
          <div className="bg-slate-900/50 px-2 py-1 rounded text-xs text-green-400 font-mono max-w-[150px] truncate">
            "<Highlight text={textContent} query={searchQuery} />"
          </div>
        )}

        {attributes.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-1 w-full">
            {attributes.slice(0, 3).map(attr => (
              <div key={attr.name} className="flex justify-between text-[10px] font-mono border-t border-slate-700/50 pt-0.5">
                <span className="text-slate-500"><Highlight text={attr.name} query={searchQuery} /></span>
                <span className="text-slate-300 truncate max-w-[80px]"><Highlight text={attr.value} query={searchQuery} /></span>
              </div>
            ))}
            {attributes.length > 3 && <span className="text-[10px] text-slate-600">+{attributes.length - 3} more</span>}
          </div>
        )}
      </div>

      {expanded && hasChildren && !textContent && (
        <div className="flex pt-6 relative">
          <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-600 -translate-x-1/2"></div>
          
          {children.map((child, idx) => {
             if (child.nodeType !== Node.ELEMENT_NODE) return null;
             
             return (
              <div key={idx} className="flex flex-col items-center px-4 relative">
                <div className="absolute top-0 left-0 w-1/2 h-px bg-slate-600" style={{ display: idx === 0 ? 'none' : 'block' }}></div>
                <div className="absolute top-0 right-0 w-1/2 h-px bg-slate-600" style={{ display: idx === children.filter(c=>c.nodeType===Node.ELEMENT_NODE).length - 1 ? 'none' : 'block' }}></div>
                <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-600 -translate-x-1/2"></div>
                
                <MapNode node={child as Element} defaultOpen={defaultOpen} searchQuery={searchQuery} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main Visualizer Component ---

interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export const Visualizer: React.FC = () => {
  const [xmlInput, setXmlInput] = usePersistentState<string>('visualizer_input', '<catalog>\n  <book id="bk101">\n    <author>Gambardella, Matthew</author>\n    <title>XML Developer\'s Guide</title>\n    <genre>Computer</genre>\n    <price>44.95</price>\n    <publish_date>2000-10-01</publish_date>\n    <description>An in-depth look at creating applications \n    with XML.</description>\n  </book>\n  <book id="bk102">\n    <author>Ralls, Kim</author>\n    <title>Midnight Rain</title>\n    <genre>Fantasy</genre>\n    <price>5.95</price>\n    <publish_date>2000-12-16</publish_date>\n    <description>A former architect battles corporate zombies.</description>\n  </book>\n</catalog>');
  const [parsedRoot, setParsedRoot] = useState<Element | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [expandKey, setExpandKey] = useState(0);

  // Template State
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Pan/Zoom State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Load templates from local storage
  useEffect(() => {
    const saved = localStorage.getItem('xml_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse templates');
      }
    }
  }, []);

  useEffect(() => {
    try {
      const doc = parseXmlString(xmlInput);
      setParsedRoot(doc.documentElement);
      setError(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } catch (e: any) {
      setParsedRoot(null);
      setError(e.message);
    }
  }, [xmlInput]);

  const toggleExpandAll = (open: boolean) => {
    setDefaultOpen(open);
    setExpandKey(prev => prev + 1);
  };

  const handleSaveTemplate = () => {
    const name = window.prompt("Enter a name for this template:");
    if (!name) return;

    const newTemplate: SavedTemplate = {
      id: crypto.randomUUID(),
      name,
      content: xmlInput,
      createdAt: Date.now()
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('xml_templates', JSON.stringify(updated));
    setSelectedTemplateId(newTemplate.id);
  };

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const template = templates.find(t => t.id === id);
    if (template) {
      setXmlInput(template.content);
    }
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) return;
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    const updated = templates.filter(t => t.id !== selectedTemplateId);
    setTemplates(updated);
    localStorage.setItem('xml_templates', JSON.stringify(updated));
    setSelectedTemplateId('');
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'map') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setScale(s => Math.min(Math.max(0.1, s + delta), 4));
    } else {
        setPosition(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'map') return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || viewMode !== 'map') return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPosition(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="h-full flex gap-4 min-h-0">
      {/* Input Section */}
      <div className="w-80 flex flex-col gap-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-400">XML Input</label>
        </div>
        
        {/* Template Controls */}
        <div className="bg-surface border border-slate-700 rounded-lg p-2 flex gap-2">
           <div className="relative flex-1">
             <select 
               value={selectedTemplateId} 
               onChange={(e) => handleLoadTemplate(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md pl-8 pr-2 py-1.5 focus:ring-1 focus:ring-primary appearance-none outline-none"
             >
               <option value="">Load Template...</option>
               {templates.map(t => (
                 <option key={t.id} value={t.id}>{t.name}</option>
               ))}
             </select>
             <FolderOpen size={12} className="absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
           </div>
           
           <button 
             onClick={handleSaveTemplate}
             className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-slate-300 hover:text-white transition-colors"
             title="Save Template"
           >
             <Save size={14} />
           </button>
           
           {selectedTemplateId && (
             <button 
               onClick={handleDeleteTemplate}
               className="p-1.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 rounded-md text-slate-300 hover:text-red-400 transition-colors"
               title="Delete Template"
             >
               <Trash2 size={14} />
             </button>
           )}
        </div>

        <textarea
          value={xmlInput}
          onChange={(e) => setXmlInput(e.target.value)}
          className="flex-1 w-full bg-surface border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-200 resize-none focus:ring-2 focus:ring-primary outline-none"
          spellCheck={false}
        />
      </div>
      
      {/* Visualization Section */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
         <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-slate-700">
           <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1 rounded-md flex gap-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                  title="List View"
                >
                  <ListIcon size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Map View"
                >
                  <Network size={16} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="ml-2 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent w-64">
                <Search size={14} className="text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search nodes..."
                  className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-full placeholder:text-slate-600"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="h-4 w-px bg-slate-700 mx-2" />
              <button onClick={() => toggleExpandAll(true)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Expand All">
                <Maximize2 size={16} />
              </button>
              <button onClick={() => toggleExpandAll(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Collapse All">
                <Minimize2 size={16} />
              </button>
           </div>
           
           {viewMode === 'map' && (
             <div className="flex items-center gap-2">
                <button onClick={() => setPosition({x:0, y:0})} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  <RotateCcw size={12} /> Reset
                </button>
                <div className="flex items-center gap-1 bg-slate-900 rounded-md px-2 py-1 border border-slate-700">
                   <ZoomOut size={14} className="text-slate-400 cursor-pointer hover:text-white" onClick={() => setScale(s => Math.max(0.1, s - 0.1))} />
                   <span className="text-xs text-slate-300 w-8 text-center">{Math.round(scale * 100)}%</span>
                   <ZoomIn size={14} className="text-slate-400 cursor-pointer hover:text-white" onClick={() => setScale(s => Math.min(4, s + 0.1))} />
                </div>
             </div>
           )}
         </div>

         <div className="flex-1 bg-[#162032] border border-slate-700 rounded-lg overflow-hidden relative">
            {error ? (
              <div className="text-red-400 p-4 text-center">Invalid XML: {error}</div>
            ) : !parsedRoot ? (
              <div className="text-slate-500 text-center mt-20">Enter XML to visualize</div>
            ) : viewMode === 'list' ? (
              <div className="p-4 overflow-auto h-full">
                <TreeNode key={expandKey} node={parsedRoot} depth={0} defaultOpen={defaultOpen} searchQuery={searchQuery} />
              </div>
            ) : (
              <div 
                ref={mapContainerRef}
                className="w-full h-full overflow-hidden cursor-move bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <div 
                  style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                    transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
                  }}
                  className="min-w-full min-h-full flex items-center justify-center p-20"
                >
                  <MapNode key={expandKey} node={parsedRoot} defaultOpen={defaultOpen} searchQuery={searchQuery} />
                </div>
                
                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-xs text-slate-400 px-3 py-1.5 rounded-full border border-slate-700 pointer-events-none flex items-center gap-2">
                  <Move size={12} />
                  Drag to pan • Scroll to zoom
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};