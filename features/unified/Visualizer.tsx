// ============================================
// Unified Visualizer - Tree View for All Formats
// ============================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataFormat, TreeNode, toTree, detectFormat } from '../../core';
import { FormatSelector, CodeEditor, TemplateManager } from '../../components/common';
import { 
  ChevronRight, ChevronDown, Tag, Type, Braces, Hash,
  Network, List as ListIcon, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Move, RotateCcw, Search, X
} from 'lucide-react';

// ============================================
// Tree Node Component
// ============================================

interface TreeNodeViewProps {
  node: TreeNode;
  depth: number;
  defaultOpen: boolean;
  searchQuery: string;
}

const TreeNodeView: React.FC<TreeNodeViewProps> = ({ node, depth, defaultOpen, searchQuery }) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  
  // Auto-expand if search matches
  const hasMatch = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return node.name.toLowerCase().includes(q) || 
           (node.value?.toLowerCase().includes(q) ?? false);
  }, [node, searchQuery]);
  
  const hasDescendantMatch = useMemo(() => {
    if (!searchQuery) return false;
    const checkChildren = (n: TreeNode): boolean => {
      const q = searchQuery.toLowerCase();
      if (n.name.toLowerCase().includes(q) || (n.value?.toLowerCase().includes(q) ?? false)) {
        return true;
      }
      return n.children.some(checkChildren);
    };
    return node.children.some(checkChildren);
  }, [node, searchQuery]);
  
  useEffect(() => {
    if (searchQuery && (hasMatch || hasDescendantMatch)) {
      setExpanded(true);
    } else if (!searchQuery) {
      setExpanded(defaultOpen);
    }
  }, [searchQuery, hasMatch, hasDescendantMatch, defaultOpen]);
  
  const hasChildren = node.children.length > 0;
  
  const getIcon = () => {
    switch (node.type) {
      case 'element':
        return <Tag size={14} className="text-blue-400" />;
      case 'attribute':
        return <Hash size={14} className="text-purple-400" />;
      case 'text':
        return <Type size={14} className="text-green-400" />;
      case 'object':
        return <Braces size={14} className="text-yellow-400" />;
      case 'array':
        return <span className="text-orange-400 font-mono text-xs">[]</span>;
      case 'value':
        return <Type size={14} className="text-cyan-400" />;
      case 'heading':
        return <span className="text-purple-400 font-bold text-xs">H</span>;
      default:
        return <Type size={14} className="text-slate-400" />;
    }
  };
  
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={i} className="bg-yellow-500/40 text-yellow-200 font-bold rounded px-0.5">{part}</span>
        : part
    );
  };
  
  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1 px-2 rounded select-none transition-colors
          ${hasMatch ? 'bg-yellow-500/10' : 'hover:bg-white/5'}
          ${hasChildren ? 'cursor-pointer' : ''}
        `}
        style={{ marginLeft: `${depth * 1.5}rem` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <span className="text-slate-500 w-4 flex justify-center">
          {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        
        {getIcon()}
        
        <span className="text-blue-400 font-mono text-sm font-semibold">
          {highlightText(node.name)}
        </span>
        
        {node.value && (
          <span className="text-green-400/80 font-mono text-sm truncate max-w-xs">
            = "{highlightText(node.value)}"
          </span>
        )}
        
        {node.type === 'array' && (
          <span className="text-slate-500 text-xs">[{node.children.length}]</span>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children.map((child, idx) => (
            <TreeNodeView
              key={child.id || idx}
              node={child}
              depth={depth + 1}
              defaultOpen={defaultOpen}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Map Node Component (for graph view)
// ============================================

interface MapNodeViewProps {
  node: TreeNode;
  defaultOpen: boolean;
  searchQuery: string;
}

const MapNodeView: React.FC<MapNodeViewProps> = ({ node, defaultOpen, searchQuery }) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  
  const hasChildren = node.children.filter(c => c.type !== 'text' && c.type !== 'value' && c.type !== 'attribute').length > 0;
  const textChild = node.children.find(c => c.type === 'text' || c.type === 'value');
  
  const getColor = () => {
    switch (node.sourceFormat) {
      case 'xml': return 'border-blue-500/50 hover:border-blue-400';
      case 'json': return 'border-green-500/50 hover:border-green-400';
      case 'markdown': return 'border-purple-500/50 hover:border-purple-400';
      default: return 'border-slate-700';
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          relative z-10 flex flex-col items-center p-2 rounded-lg border shadow-lg 
          transition-all duration-200 cursor-pointer min-w-[100px]
          ${expanded ? `bg-surface ${getColor()}` : `bg-surface/50 border-slate-700 ${getColor()}`}
        `}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold font-mono text-sm text-blue-400">
            {node.name}
          </span>
          {hasChildren && (
            <span className="text-slate-500">
              {expanded ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            </span>
          )}
        </div>
        
        {textChild?.value && (
          <div className="bg-slate-900/50 px-2 py-1 rounded text-xs text-green-400 font-mono max-w-[150px] truncate">
            "{textChild.value}"
          </div>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="flex pt-6 relative">
          <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-600 -translate-x-1/2"></div>
          
          {node.children
            .filter(c => c.type !== 'text' && c.type !== 'value' && c.type !== 'attribute')
            .map((child, idx) => (
              <div key={child.id || idx} className="flex flex-col items-center px-4 relative">
                <div className="absolute top-0 left-1/2 w-px h-6 bg-slate-600 -translate-x-1/2"></div>
                <MapNodeView node={child} defaultOpen={defaultOpen} searchQuery={searchQuery} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Visualizer Component
// ============================================

export const UnifiedVisualizer: React.FC = () => {
  const [input, setInput] = useState<string>('{\n  "users": [\n    {"name": "Alice", "age": 30},\n    {"name": "Bob", "age": 25}\n  ]\n}');
  const [inputFormat, setInputFormat] = useState<DataFormat>('json');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pan/Zoom for map view
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  // Auto-detect format
  useEffect(() => {
    if (input.trim()) {
      const detected = detectFormat(input);
      if (detected.confidence > 0.5) {
        setInputFormat(detected.format);
      }
    }
  }, [input]);
  
  // Parse to tree
  useEffect(() => {
    if (!input.trim()) {
      setTree(null);
      setError(null);
      return;
    }
    
    const result = toTree(input, inputFormat);
    if (result.success && result.data) {
      setTree(result.data);
      setError(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setTree(null);
      setError(result.error || 'Failed to parse');
    }
  }, [input, inputFormat]);
  
  const toggleExpandAll = (open: boolean) => {
    setDefaultOpen(open);
    setRefreshKey(k => k + 1);
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
  
  const handleLoadTemplate = (content: string, format: DataFormat) => {
    setInput(content);
    setInputFormat(format);
  };
  
  return (
    <div className="h-full flex gap-4 min-h-0">
      {/* Input Panel */}
      <div className="w-80 flex flex-col gap-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-400">Input</label>
          <FormatSelector value={inputFormat} onChange={setInputFormat} size="sm" />
        </div>
        
        <TemplateManager
          currentContent={input}
          currentFormat={inputFormat}
          onLoad={handleLoadTemplate}
        />
        
        <div className="flex-1 bg-surface border border-slate-700 rounded-lg overflow-hidden">
          <CodeEditor
            value={input}
            onChange={setInput}
            format={inputFormat}
            placeholder="Paste content to visualize..."
          />
        </div>
      </div>
      
      {/* Visualization Panel */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
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
            
            {/* Search */}
            <div className="ml-2 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary w-64">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="h-4 w-px bg-slate-700 mx-2" />
            
            {/* Expand/Collapse */}
            <button
              onClick={() => toggleExpandAll(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
              title="Expand All"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={() => toggleExpandAll(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
              title="Collapse All"
            >
              <Minimize2 size={16} />
            </button>
          </div>
          
          {/* Map View Controls */}
          {viewMode === 'map' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPosition({ x: 0, y: 0 })}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <div className="flex items-center gap-1 bg-slate-900 rounded-md px-2 py-1 border border-slate-700">
                <ZoomOut
                  size={14}
                  className="text-slate-400 cursor-pointer hover:text-white"
                  onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                />
                <span className="text-xs text-slate-300 w-8 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <ZoomIn
                  size={14}
                  className="text-slate-400 cursor-pointer hover:text-white"
                  onClick={() => setScale(s => Math.min(4, s + 0.1))}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Visualization Area */}
        <div className="flex-1 bg-[#162032] border border-slate-700 rounded-lg overflow-hidden relative">
          {error ? (
            <div className="text-red-400 p-4 text-center">
              Invalid {inputFormat.toUpperCase()}: {error}
            </div>
          ) : !tree ? (
            <div className="text-slate-500 text-center mt-20">
              Enter content to visualize
            </div>
          ) : viewMode === 'list' ? (
            <div className="p-4 overflow-auto h-full">
              <TreeNodeView
                key={refreshKey}
                node={tree}
                depth={0}
                defaultOpen={defaultOpen}
                searchQuery={searchQuery}
              />
            </div>
          ) : (
            <div
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
                <MapNodeView
                  key={refreshKey}
                  node={tree}
                  defaultOpen={defaultOpen}
                  searchQuery={searchQuery}
                />
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
