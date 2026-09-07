import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth.ts';
import { db, DBNiche } from './db.ts';

export const nicheRouter = Router();

export type NicheOpportunity = DBNiche;

nicheRouter.post('/search', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { filters, page = 1, limit = 10 } = req.body;
  const userId = req.user?.id;

  const { results, total, totalPages } = await db.searchNiches(filters, Number(page), Number(limit));

  // Track recent search and usage if user is present
  if (userId) {
    const searchDescription = filters?.category || 'Niche Research Filter';
    const searchId = 'srch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.setRecentSearch(searchId, {
      id: searchId,
      userId,
      query: searchDescription,
      type: 'niche',
      resultsCount: total,
      timestamp: new Date().toISOString()
    });

    const usage = await db.getUsageRecord(userId);
    if (usage) {
      usage.nicheQueriesUsed++;
    }
  }

  res.json({ 
    success: true, 
    data: results,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  });
});
