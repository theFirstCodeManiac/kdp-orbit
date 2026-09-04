import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { 
  TrendingUp, TrendingDown, Star, Flame, Zap, TreePine, Clock, AlertCircle
} from 'lucide-react';

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  metric: string;
  description: string;
  type: 'niche' | 'book';
}

interface TrendsData {
  lastUpdated: string;
  updateFrequencyText: string;
  fastMovers: TrendingItem[];
  trendingNiches: TrendingItem[];
  popularBooks: TrendingItem[];
  evergreen: TrendingItem[];
  declining: TrendingItem[];
}

export const TrendingResearchView: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/trends/market-pulse', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error?.message || 'Failed to fetch trends');
        }
      } catch (err: any) {
        setError('Network error: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrends();
  }, [token]);

  const ItemList = ({ items, icon, colorClass, emptyMsg }: { items: TrendingItem[], icon: React.ReactNode, colorClass: string, emptyMsg: string }) => {
    if (items.length === 0) {
      return <div className="p-4 text-sm text-slate-500 italic">{emptyMsg}</div>;
    }
    
    return (
      <div className="flex flex-col h-full">
        {items.map((item, idx) => (
          <div key={item.id} className={`p-5 flex gap-4 ${idx !== items.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition group flex-1`}>
            <div className={`mt-0.5 shrink-0 ${colorClass}`}>
              {icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{item.type.toUpperCase()}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition">
                {item.title}
              </h4>
              <div className={`text-xs font-black mb-2 ${colorClass}`}>
                {item.metric}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 border border-violet-200 mb-3">
            <Flame className="h-3.5 w-3.5" />
            Market Pulse
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Trending & Bestseller Research
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover fast-moving opportunities, evergreen niches, and declining markets.
          </p>
        </div>
        
        {data && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm shrink-0">
            <Clock className="h-4 w-4 text-slate-400" />
            {data.updateFrequencyText}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-64 bg-white border border-slate-100 rounded-xl shadow-sm animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Trending Niches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-violet-50/50 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <h3 className="font-bold text-slate-800">Trending Niches</h3>
            </div>
            <ItemList 
              items={data.trendingNiches} 
              icon={<TrendingUp className="h-5 w-5" />} 
              colorClass="text-violet-600"
              emptyMsg="No trending niches currently identified."
            />
          </div>

          {/* Fast Movers */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-800">Fast Movers</h3>
            </div>
            <ItemList 
              items={data.fastMovers} 
              icon={<Zap className="h-5 w-5" />} 
              colorClass="text-amber-500"
              emptyMsg="No fast-moving opportunities detected today."
            />
          </div>

          {/* Popular Books */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col xl:row-span-2">
            <div className="p-4 border-b border-slate-100 bg-yellow-50/50 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="font-bold text-slate-800">Popular Books</h3>
            </div>
            <ItemList 
              items={data.popularBooks} 
              icon={<Star className="h-5 w-5" />} 
              colorClass="text-yellow-600"
              emptyMsg="Top books data is currently unavailable."
            />
          </div>

          {/* Evergreen Opportunities */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-2">
              <TreePine className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Evergreen Opportunities</h3>
            </div>
            <ItemList 
              items={data.evergreen} 
              icon={<TreePine className="h-5 w-5" />} 
              colorClass="text-emerald-600"
              emptyMsg="No evergreen data available right now."
            />
          </div>

          {/* Declining */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-slate-800">Declining Opportunities</h3>
            </div>
            <ItemList 
              items={data.declining} 
              icon={<TrendingDown className="h-5 w-5" />} 
              colorClass="text-rose-500"
              emptyMsg="No major declines detected."
            />
          </div>

        </div>
      )}
    </div>
  );
};
