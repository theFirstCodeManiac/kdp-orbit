import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { 
  Bookmark, Folder, Target, Key, BookOpen, FileText, Briefcase, 
  Plus, Search, AlertCircle, ChevronRight, MoreVertical 
} from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: string;
}

interface SavedItem {
  id: string;
  collectionId: string;
  type: 'keyword' | 'niche' | 'book' | 'report' | 'project';
  title: string;
  subtitle: string;
  addedAt: string;
}

interface SavedResearchViewProps {
  onNavigateToNiche?: () => void;
  onNavigateToBook?: () => void;
  onNavigateToKeyword?: () => void;
}

export const SavedResearchView: React.FC<SavedResearchViewProps> = ({ onNavigateToNiche, onNavigateToBook, onNavigateToKeyword }) => {
  const { token } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCollections = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/saved/collections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCollections(json.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/saved/items?collectionId=${activeCollectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (err: any) {
      console.error(err);
      setError('We couldn\'t load your saved items right now. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [token, activeCollectionId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;
    
    try {
      const res = await fetch('/api/saved/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName })
      });
      const json = await res.json();
      if (json.success) {
        setCollections([...collections, json.data]);
        setNewFolderName('');
        setIsCreatingFolder(false);
        setActiveCollectionId(json.data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Key className="h-5 w-5 text-indigo-500" />;
      case 'niche': return <Target className="h-5 w-5 text-emerald-500" />;
      case 'book': return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'report': return <FileText className="h-5 w-5 text-amber-500" />;
      case 'project': return <Briefcase className="h-5 w-5 text-violet-500" />;
      default: return <Bookmark className="h-5 w-5 text-slate-500" />;
    }
  };

  const getItemLabel = (type: string) => {
    switch (type) {
      case 'keyword': return 'Keyword';
      case 'niche': return 'Niche';
      case 'book': return 'Book';
      case 'report': return 'Report';
      case 'project': return 'Project';
      default: return 'Item';
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden pb-8">
      {/* Sidebar - Collections */}
      <div className="w-full md:w-64 shrink-0 bg-slate-50/50 border-r border-slate-200 overflow-y-auto hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Folders</h2>
        </div>
        
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <button
            onClick={() => setActiveCollectionId('all')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-sm font-medium ${
              activeCollectionId === 'all' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="h-4 w-4 opacity-70" />
              All Saved
            </div>
          </button>

          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-sm font-medium group ${
                activeCollectionId === col.id ? 'bg-indigo-100 text-indigo-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate pr-2">
                <Folder className="h-4 w-4 opacity-70 shrink-0" />
                <span className="truncate">{col.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
          {isCreatingFolder ? (
            <form onSubmit={handleCreateFolder} className="space-y-2">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full text-sm rounded border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={!newFolderName.trim()} className="flex-1 bg-indigo-600 text-white text-xs font-semibold py-1.5 rounded hover:bg-indigo-700">Save</button>
                <button type="button" onClick={() => setIsCreatingFolder(false)} className="flex-1 bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 rounded hover:bg-slate-200">Cancel</button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsCreatingFolder(true)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition"
            >
              <Plus className="h-4 w-4" /> New Folder
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Mobile Folder Selector (Visible only on small screens) */}
        <div className="md:hidden border-b border-slate-200 p-3 bg-slate-50 flex overflow-x-auto gap-2">
          <button
            onClick={() => setActiveCollectionId('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeCollectionId === 'all' ? 'bg-indigo-100 text-indigo-900' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            All Saved
          </button>
          {collections.map(col => (
             <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeCollectionId === col.id ? 'bg-indigo-100 text-indigo-900' : 'bg-white border border-slate-200 text-slate-600'
              }`}
           >
             {col.name}
           </button>
          ))}
        </div>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {activeCollectionId === 'all' 
                  ? 'All Saved Research' 
                  : collections.find(c => c.id === activeCollectionId)?.name || 'Folder'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} found in this collection.
              </p>
            </div>
            
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search saved items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex items-center gap-2 mb-6">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-slate-200 border-dashed rounded-2xl shadow-xs">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Folder className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {activeCollectionId === 'keywords' ? "You haven't saved any keywords yet" : "You haven't saved any research yet"}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-6">
                {searchQuery ? "No items match your search filter." : "Research a keyword and save useful opportunities here."}
              </p>
              {!searchQuery && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={onNavigateToKeyword || onNavigateToBook}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    Research Keywords
                  </button>
                  <button 
                    onClick={onNavigateToNiche}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition text-sm shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Target className="h-4 w-4" />
                    Research Niches
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition group flex flex-col cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {getItemIcon(item.type)}
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 p-1 rounded-md opacity-0 group-hover:opacity-100 transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {getItemLabel(item.type)}
                    </div>
                    <h3 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>
                      {new Date(item.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      View <ChevronRight className="h-3 w-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
