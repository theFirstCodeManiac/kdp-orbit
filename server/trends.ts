import { Router } from 'express';
import { requireAuth } from './auth.ts';
import { db, DBTrendingItem } from './db.ts';

export const trendsRouter = Router();

export type TrendingItem = DBTrendingItem;

export interface TrendsData {
  lastUpdated: string;
  updateFrequencyText: string;
  fastMovers: TrendingItem[];
  trendingNiches: TrendingItem[];
  popularBooks: TrendingItem[];
  evergreen: TrendingItem[];
  declining: TrendingItem[];
}

trendsRouter.get('/market-pulse', requireAuth, async (req, res) => {
  // Set cache headers to avoid unnecessary downloads within the same hour
  res.setHeader('Cache-Control', 'private, max-age=3600');

  const data = await db.getTrends();
  res.json({ success: true, data });
});
