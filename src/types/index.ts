/**
 * Core Domain Entities & System Models
 * Defines user roles, subscription tiers, research metrics, and book assets.
 */

export type UserRole = 'author' | 'pro_publisher' | 'agency' | 'admin';

export type SubscriptionPlanId = 'free_starter' | 'author_pro' | 'publisher_elite';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  country: string;
  preferredCurrency: 'USD' | 'NGN' | 'GBP';
  planId: SubscriptionPlanId;
  createdAt: string;
  lastLoginAt: string;
  isEmailVerified: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  description: string;
  priceMonthlyUSD: number;
  priceMonthlyNGN: number;
  features: string[];
  limits: {
    keywordSearchesPerMonth: number;
    nicheAnalysesPerMonth: number;
    bestsellerAnalysesPerMonth: number;
    aiAssistantCreditsPerMonth: number;
    savedProjectsMax: number;
    coverExportsPerMonth: number;
  };
}

export interface UsageQuota {
  userId: string;
  periodStart: string;
  periodEnd: string;
  keywordSearchesUsed: number;
  nicheAnalysesUsed: number;
  bestsellerAnalysesUsed: number;
  aiAssistantCreditsUsed: number;
  coverExportsUsed: number;
}

export type OpportunityDemand = 'Low' | 'Moderate' | 'High' | 'Very High';
export type OpportunityCompetition = 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Fierce';
export type OpportunityTrend = 'Declining' | 'Stable' | 'Growing' | 'Breakout';
export type SaturationLevel = 'Undersaturated' | 'Healthy' | 'Moderate' | 'Oversaturated';

export interface OpportunityScorecard {
  score: number; // 0 - 100
  rating: 'Exceptional' | 'Strong' | 'Viable' | 'Challenging' | 'Avoid';
  demand: OpportunityDemand;
  competition: OpportunityCompetition;
  trend: OpportunityTrend;
  saturation: SaturationLevel;
  explanation: {
    summary: string;
    whyDemand: string;
    whyCompetition: string;
    recommendedAction: string;
  };
  metrics: {
    estimatedMonthlySearches: number;
    avgBestsellerRank: number;
    avgPriceUSD: number;
    avgReviewCount: number;
    topCompetitorStrength: number; // 0-100
    indieAuthorDominance: number; // Percentage 0-100
  };
}

export interface KeywordResult {
  id: string;
  keyword: string;
  marketplace: string;
  searchVolumeIndicator: number; // monthly indicator
  searchVolumeTrend: number; // % change
  competitionCount: number; // Total search results on Amazon
  rankingDifficulty: 'Easy' | 'Medium' | 'Hard';
  opportunityScore: OpportunityScorecard;
  cpcUSD: number;
  topCategories: string[];
  suggestedLongtails: string[];
  dataSource: 'Demo Data' | 'Live Amazon Index';
  updatedAt: string;
}

export interface NicheCategory {
  id: string;
  path: string; // e.g., Books > Children's Books > Activities, Crafts & Games > Activity Books
  name: string;
  bsrThresholdForTop10: number;
  estimatedDailySalesTop10: number;
  avgRoyaltyPerSaleUSD: number;
  saturationScore: number;
  opportunity: OpportunityScorecard;
  trendingKeywords: string[];
}

export interface BookCompetitor {
  id: string;
  asin: string;
  title: string;
  subtitle?: string;
  author: string;
  coverUrl: string;
  bsr: number;
  priceUSD: number;
  rating: number;
  reviewCount: number;
  publicationDate: string;
  pageCount: number;
  estimatedMonthlySales: number;
  estimatedMonthlyRevenueUSD: number;
  isKDPSelect: boolean;
  bookFormat: 'Paperback' | 'Hardcover' | 'Kindle eBook';
}

export interface CoverProject {
  id: string;
  title: string;
  trimWidthInches: number;
  trimHeightInches: number;
  pageCount: number;
  paperColor: 'white' | 'cream' | 'color';
  spineWidthInches: number;
  fullWidthInches: number;
  fullHeightInches: number;
  bleedInches: number;
  designData: any;
  updatedAt: string;
}
