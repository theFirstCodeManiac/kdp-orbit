import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth.ts';
import { db } from './db.ts';

export const competitionRouter = Router();

competitionRouter.post('/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { keyword } = req.body;
  const userId = req.user?.id;

  const analysis = await db.analyzeCompetition(keyword);

  // Record recent search if authenticated user
  if (userId && keyword && keyword.trim() !== '') {
    const searchId = 'srch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    await db.setRecentSearch(searchId, {
      id: searchId,
      userId,
      query: keyword.trim(),
      type: 'keyword',
      resultsCount: analysis.metrics.totalBooksFound,
      timestamp: new Date().toISOString()
    });

    const usage = await db.getUsageRecord(userId);
    if (usage) {
      usage.keywordSearchesUsed++;
    }
  }

  res.json({
    success: true,
    data: analysis
  });
});
