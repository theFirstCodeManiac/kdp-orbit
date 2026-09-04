import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { 
  Search, SlidersHorizontal, ArrowUpRight, TrendingUp, TrendingDown, Minus, 
  Settings2, Activity, Target, Shield, BookOpen, Star, AlertCircle, RefreshCw,
  Info
} from 'lucide-react';

interface NicheOpportunity {
  id: string;
  title: string;
  category: string;
  demandScore: number;
  competitionScore: number;
  trendScore: number;
  marketSizeUSD: number;
  bookActivity: number;
  pricingAverageUSD: number;
  reviewAverage: number;
  bestsellerSignals: number;
  otherIndicators: {
    monthlySearches: number;
    amazonRelevance: number;
  };
}

export const NicheResearchView: React.FC = () => {
  const { token } = useAuth();
  
  // Filtering state
  const [filters, setFilters] = useState({
    demand: 'All', // All, High, Medium, Low
    competition: 'All', // All, Low, Medium, High
    trend: 'All', // All, Growing, Stable, Declining
    category: 'All',
    minPrice: '',
  });

  // Algorithm Weights
  const [weights, setWeights] = useState({
    demand: 35,
    competition: 30, // Recall: higher competition score means lower competition (easier)
    trend: 20,
    bestseller: 15
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [results, setResults] = useState<NicheOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Build safe filters payload
      const safeFilters: any = {};
      if (filters.demand !== 'All') safeFilters.demand = filters.demand;
      if (filters.competition !== 'All') safeFilters.competition = filters.competition;
      if (filters.trend !== 'All') safeFilters.trend = filters.trend;
      if (filters.category !== 'All') safeFilters.category = filters.category;
      if (filters.minPrice) safeFilters.minPrice = filters.minPrice;

      const res = await fetch('/api/niche/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ filters: safeFilters })
      });
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch niches.');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  // Initial load
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const calculateScore = (n: NicheOpportunity) => {
    const totalWeight = weights.demand + weights.competition + weights.trend + weights.bestseller;
    if (totalWeight === 0) return 0;
    
    // Normalize weights
    const wDemand = weights.demand / totalWeight;
    const wComp = weights.competition / totalWeight;
    const wTrend = weights.trend / totalWeight;
    const wBest = weights.bestseller / totalWeight;
    
    const score = (n.demandScore * wDemand) + 
                  (n.competitionScore * wComp) + 
                  (n.trendScore * wTrend) + 
                  (n.bestsellerSignals * wBest);
                  
    return Math.round(score);
  };

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200 mb-3">
            <Target className="h-3.5 w-3.5" />
            Niche Discovery Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Find Profitable Niches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover high-demand, low-competition book niches using our transparent opportunity algorithm.
          </p>
        </div>
        
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition border ${
            isConfigOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings2 className="h-4 w-4" />
          Configure Algorithm
        </button>
      </div>

      {isConfigOpen && (
        <div className="bg-slate-800 rounded-xl p-5 shadow-lg border border-slate-700 text-white animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Opportunity Score Algorithm
            </h3>
            <span className="text-xs text-slate-400">Total Weight: {weights.demand + weights.competition + weights.trend + weights.bestseller}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-3xl">
            Unlike black-box tools, KDP Orbit lets you control how the Opportunity Score is calculated. 
            Adjust the weights below to prioritize what matters most to your publishing strategy.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex justify-between mb-2">
                <span>Demand Weight</span>
                <span className="text-emerald-400">{weights.demand}%</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={weights.demand} 
                onChange={(e) => handleWeightChange('demand', parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex justify-between mb-2">
                <span>Competition Weight</span>
                <span className="text-blue-400">{weights.competition}%</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={weights.competition} 
                onChange={(e) => handleWeightChange('competition', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex justify-between mb-2">
                <span>Trend Weight</span>
                <span className="text-purple-400">{weights.trend}%</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={weights.trend} 
                onChange={(e) => handleWeightChange('trend', parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex justify-between mb-2">
                <span>Bestseller Signals Weight</span>
                <span className="text-amber-400">{weights.bestseller}%</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={weights.bestseller} 
                onChange={(e) => handleWeightChange('bestseller', parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm self-start sticky top-24">
          <div className="flex items-center gap-2 font-bold text-slate-800 pb-3 border-b border-slate-100">
            <SlidersHorizontal className="h-4 w-4" />
            Market Filters
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Category</label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters(f => ({...f, category: e.target.value}))}
                className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-8 bg-slate-50 border"
              >
                <option value="All">All Categories</option>
                <option value="Publishing">Publishing</option>
                <option value="Self-Help">Self-Help</option>
                <option value="Psychology">Psychology</option>
                <option value="Hobbies">Hobbies</option>
                <option value="Health">Health & Diet</option>
                <option value="Business">Business</option>
                <option value="Fiction">Fiction</option>
                <option value="Travel">Travel</option>
                <option value="Tech/Science">Tech & Science</option>
                <option value="Cookbooks">Cookbooks</option>
                <option value="Spirituality">Spirituality</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Demand Level</label>
              <select 
                value={filters.demand}
                onChange={(e) => setFilters(f => ({...f, demand: e.target.value}))}
                className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-8 bg-slate-50 border"
              >
                <option value="All">Any Demand</option>
                <option value="High">High Demand</option>
                <option value="Medium">Medium Demand</option>
                <option value="Low">Low Demand</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Competition</label>
              <select 
                value={filters.competition}
                onChange={(e) => setFilters(f => ({...f, competition: e.target.value}))}
                className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-8 bg-slate-50 border"
              >
                <option value="All">Any Competition</option>
                <option value="Low">Low (Easier to Rank)</option>
                <option value="Medium">Medium</option>
                <option value="High">High (Harder)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Market Trend</label>
              <select 
                value={filters.trend}
                onChange={(e) => setFilters(f => ({...f, trend: e.target.value}))}
                className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-8 bg-slate-50 border"
              >
                <option value="All">Any Trend</option>
                <option value="Growing">Growing</option>
                <option value="Stable">Stable</option>
                <option value="Declining">Declining</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Min Price (USD)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-medium">$</span>
                <input 
                  type="number" 
                  placeholder="e.g. 9.99"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(f => ({...f, minPrice: e.target.value}))}
                  className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 py-2 pl-7 pr-3 bg-slate-50 border"
                />
              </div>
            </div>
            
            <button 
              onClick={performSearch}
              className="w-full bg-blue-600 text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-2"
            >
              <Search className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-lg">No Niches Found</h3>
              <p className="text-sm text-slate-500 mt-1">Try loosening your filters to discover more opportunities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  {results.length} Opportunities Found
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Score derived from custom weights
                </span>
              </div>
              
              {/* Sort results by calculated score dynamically */}
              {[...results].sort((a, b) => calculateScore(b) - calculateScore(a)).map(niche => {
                const score = calculateScore(niche);
                const scoreColor = score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                                   score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' : 
                                   'text-rose-700 bg-rose-50 border-rose-200';
                                   
                return (
                  <div key={niche.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {niche.category}
                          </span>
                          {niche.trendScore >= 80 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              <TrendingUp className="h-3 w-3" /> Hot Trend
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight mb-2 group-hover:text-blue-700 transition">
                          {niche.title}
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-slate-400" />
                            <span>{niche.otherIndicators.monthlySearches.toLocaleString()} searches/mo</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                            <span>${niche.pricingAverageUSD.toFixed(2)} Avg Price</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-400" />
                            <span>{niche.reviewAverage.toFixed(1)} Avg Rating</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-5">
                        <div className="text-center sm:text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Opportunity Score
                          </div>
                          <div className={`inline-flex items-center justify-center h-12 min-w-16 px-3 rounded-xl border-2 font-black text-2xl ${scoreColor}`}>
                            {score}
                          </div>
                        </div>
                        <button className="sm:mt-4 text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-1.5">
                          Deep Dive <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Underlying Metrics Bar */}
                    <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Demand</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${niche.demandScore}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{niche.demandScore}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Competition (Low)</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${niche.competitionScore}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{niche.competitionScore}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Trend</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${niche.trendScore}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{niche.trendScore}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Bestseller Signal</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${niche.bestsellerSignals}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-6 text-right">{niche.bestsellerSignals}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
