import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './auth.ts';
import { db, DBBook } from './db.ts';

export const booksRouter = Router();

export type BookData = DBBook;

booksRouter.post('/search', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { query, page = 1, limit = 10, category } = req.body;
  const userId = req.user?.id;

  const { results, total, totalPages } = await db.searchBooks(query, Number(page), Number(limit), category);

  // Track recent search and usage if user is present
  if (userId) {
    if (query && query.trim() !== '') {
      const searchId = 'srch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.setRecentSearch(searchId, {
        id: searchId,
        userId,
        query: query.trim(),
        type: 'book',
        resultsCount: total,
        timestamp: new Date().toISOString()
      });
    }

    const usage = await db.getUsageRecord(userId);
    if (usage) {
      usage.keywordSearchesUsed++;
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
