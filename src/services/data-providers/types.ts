/**
 * Data Provider Abstraction Layer
 * Ensures the platform never fabricates Amazon data and allows swapping
 * provider implementations (Demo Data vs Live APIs/Scrapers/Licensed Data).
 */

import { BookCompetitor, KeywordResult, NicheCategory, OpportunityScorecard } from '@/src/types/index.ts';

export interface DataProviderStatus {
  providerName: string;
  isLive: boolean;
  attribution: string;
  latencyMs: number;
}

export interface IKeywordDataProvider {
  searchKeywords(term: string, marketplace?: string): Promise<KeywordResult[]>;
  getKeywordSuggestions(term: string): Promise<string[]>;
  calculateOpportunity(term: string, metrics: any): OpportunityScorecard;
}

export interface INicheDataProvider {
  getNicheCategories(search?: string): Promise<NicheCategory[]>;
  getNicheDeepDive(categoryId: string): Promise<NicheCategory | null>;
}

export interface IBookDataProvider {
  searchBooks(query: string, marketplace?: string): Promise<BookCompetitor[]>;
  getBookDetails(asin: string): Promise<BookCompetitor | null>;
  estimateSalesFromBSR(bsr: number, format: 'Paperback' | 'Kindle eBook'): {
    dailySales: number;
    monthlySales: number;
  };
}

export interface IMarketDataProvider {
  getBestsellerTrends(): Promise<{
    hotNiches: NicheCategory[];
    breakoutKeywords: string[];
    topMoverBooks: BookCompetitor[];
  }>;
}

export interface IDataProviderFactory {
  keywordProvider: IKeywordDataProvider;
  nicheProvider: INicheDataProvider;
  bookProvider: IBookDataProvider;
  marketProvider: IMarketDataProvider;
  getStatus(): DataProviderStatus;
}
