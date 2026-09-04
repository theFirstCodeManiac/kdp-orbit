import { Router } from 'express';
import { requireAuth } from './auth.ts';

export const nicheRouter = Router();

export interface NicheOpportunity {
  id: string;
  title: string;
  category: string;
  demandScore: number;       // 0-100
  competitionScore: number;  // 0-100 (100 = very low competition, better opportunity)
  trendScore: number;        // 0-100
  marketSizeUSD: number;
  bookActivity: number;      // 0-100
  pricingAverageUSD: number;
  reviewAverage: number;
  bestsellerSignals: number; // 0-100
  otherIndicators: {
    monthlySearches: number;
    amazonRelevance: number; // 0-100
  };
}

const mockNiches: NicheOpportunity[] = [
  { id: 'n1', title: 'AI Prompts for Romance Authors', category: 'Publishing', demandScore: 85, competitionScore: 90, trendScore: 95, marketSizeUSD: 15000, bookActivity: 75, pricingAverageUSD: 14.99, reviewAverage: 4.2, bestsellerSignals: 80, otherIndicators: { monthlySearches: 12000, amazonRelevance: 88 } },
  { id: 'n2', title: 'Stoicism Journal for Teens', category: 'Self-Help', demandScore: 78, competitionScore: 60, trendScore: 85, marketSizeUSD: 45000, bookActivity: 85, pricingAverageUSD: 12.50, reviewAverage: 4.5, bestsellerSignals: 70, otherIndicators: { monthlySearches: 25000, amazonRelevance: 92 } },
  { id: 'n3', title: 'Shadow Work Workbook for Men', category: 'Psychology', demandScore: 92, competitionScore: 40, trendScore: 90, marketSizeUSD: 120000, bookActivity: 95, pricingAverageUSD: 16.99, reviewAverage: 4.8, bestsellerSignals: 95, otherIndicators: { monthlySearches: 80000, amazonRelevance: 96 } },
  { id: 'n4', title: 'Indoor Gardening for Cats', category: 'Hobbies', demandScore: 65, competitionScore: 85, trendScore: 60, marketSizeUSD: 8000, bookActivity: 50, pricingAverageUSD: 9.99, reviewAverage: 4.0, bestsellerSignals: 40, otherIndicators: { monthlySearches: 5000, amazonRelevance: 75 } },
  { id: 'n5', title: 'Low FODMAP Diet Cookbook for Seniors', category: 'Health', demandScore: 75, competitionScore: 70, trendScore: 65, marketSizeUSD: 35000, bookActivity: 80, pricingAverageUSD: 19.99, reviewAverage: 4.6, bestsellerSignals: 65, otherIndicators: { monthlySearches: 18000, amazonRelevance: 85 } },
  { id: 'n6', title: 'Vertical Farming Business Plan', category: 'Business', demandScore: 60, competitionScore: 95, trendScore: 80, marketSizeUSD: 12000, bookActivity: 40, pricingAverageUSD: 24.99, reviewAverage: 4.1, bestsellerSignals: 55, otherIndicators: { monthlySearches: 6000, amazonRelevance: 78 } },
  { id: 'n7', title: 'Cozy Mystery Set in a Bakery', category: 'Fiction', demandScore: 95, competitionScore: 20, trendScore: 75, marketSizeUSD: 250000, bookActivity: 100, pricingAverageUSD: 4.99, reviewAverage: 4.3, bestsellerSignals: 98, otherIndicators: { monthlySearches: 150000, amazonRelevance: 99 } },
  { id: 'n8', title: 'Python Programming for Biologists', category: 'Tech/Science', demandScore: 70, competitionScore: 88, trendScore: 72, marketSizeUSD: 22000, bookActivity: 55, pricingAverageUSD: 29.99, reviewAverage: 4.7, bestsellerSignals: 60, otherIndicators: { monthlySearches: 8500, amazonRelevance: 82 } },
  { id: 'n9', title: 'Budget Travel in Eastern Europe 2027', category: 'Travel', demandScore: 55, competitionScore: 75, trendScore: 88, marketSizeUSD: 18000, bookActivity: 45, pricingAverageUSD: 15.99, reviewAverage: 4.4, bestsellerSignals: 50, otherIndicators: { monthlySearches: 7000, amazonRelevance: 80 } },
  { id: 'n10', title: 'Mushroom Foraging Guide PNW', category: 'Nature', demandScore: 82, competitionScore: 65, trendScore: 78, marketSizeUSD: 40000, bookActivity: 70, pricingAverageUSD: 18.50, reviewAverage: 4.6, bestsellerSignals: 75, otherIndicators: { monthlySearches: 22000, amazonRelevance: 89 } },
  { id: 'n11', title: 'Tarot for Healing Trauma', category: 'Spirituality', demandScore: 88, competitionScore: 55, trendScore: 92, marketSizeUSD: 60000, bookActivity: 82, pricingAverageUSD: 22.00, reviewAverage: 4.7, bestsellerSignals: 85, otherIndicators: { monthlySearches: 35000, amazonRelevance: 91 } },
  { id: 'n12', title: 'Keto Chaffle Recipes', category: 'Cookbooks', demandScore: 50, competitionScore: 10, trendScore: 30, marketSizeUSD: 150000, bookActivity: 98, pricingAverageUSD: 8.99, reviewAverage: 4.1, bestsellerSignals: 88, otherIndicators: { monthlySearches: 45000, amazonRelevance: 85 } },
];

nicheRouter.post('/search', requireAuth, (req, res) => {
  const { filters } = req.body;
  
  let results = [...mockNiches];
  
  if (filters) {
    if (filters.demand) {
      if (filters.demand === 'High') results = results.filter(n => n.demandScore >= 75);
      else if (filters.demand === 'Medium') results = results.filter(n => n.demandScore >= 40 && n.demandScore < 75);
      else if (filters.demand === 'Low') results = results.filter(n => n.demandScore < 40);
    }
    
    if (filters.competition) {
      // Remember: higher competitionScore means LOW competition (easier to rank)
      if (filters.competition === 'Low') results = results.filter(n => n.competitionScore >= 75);
      else if (filters.competition === 'Medium') results = results.filter(n => n.competitionScore >= 40 && n.competitionScore < 75);
      else if (filters.competition === 'High') results = results.filter(n => n.competitionScore < 40);
    }
    
    if (filters.trend) {
      if (filters.trend === 'Growing') results = results.filter(n => n.trendScore >= 70);
      else if (filters.trend === 'Stable') results = results.filter(n => n.trendScore >= 40 && n.trendScore < 70);
      else if (filters.trend === 'Declining') results = results.filter(n => n.trendScore < 40);
    }
    
    if (filters.minPrice) {
      results = results.filter(n => n.pricingAverageUSD >= parseFloat(filters.minPrice));
    }
    
    if (filters.category && filters.category !== 'All') {
       results = results.filter(n => n.category.toLowerCase() === filters.category.toLowerCase());
    }
  }
  
  res.json({ success: true, data: results });
});

