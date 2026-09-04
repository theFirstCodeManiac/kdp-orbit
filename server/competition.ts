import { Router } from 'express';
import { requireAuth } from './auth.ts';

export const competitionRouter = Router();

competitionRouter.post('/analyze', requireAuth, (req, res) => {
  const { keyword } = req.body;
  const kw = (keyword || 'Test Niche').toLowerCase();
  
  // Deterministic mock logic based on keyword
  const isHigh = kw.includes('notebook') || kw.includes('journal') || kw.includes('planner') || kw.includes('coloring');
  const isLow = kw.includes('quantum') || kw.includes('fodmap') || kw.includes('obscure') || kw.includes('advanced');
  
  const compLevel = isHigh ? 'High' : isLow ? 'Low' : 'Moderate';
  
  const compReason = isHigh 
    ? 'This niche is heavily saturated. It typically requires significant ad spend, an established audience, and unique branding to stand out among thousands of existing titles.'
    : isLow 
    ? 'Very few high-quality books address this specific topic directly. A well-optimized listing and professional cover can easily capture organic traffic here.'
    : 'There is a healthy balance of demand and competition. While established books dominate the top spots, there is ample room for highly targeted sub-niches to succeed.';

  res.json({
    success: true,
    data: {
      keyword: keyword || 'Example Search',
      competitionLevel: compLevel,
      summaryReason: compReason,
      metrics: {
        totalBooksFound: isHigh ? 10000 : isLow ? 150 : 3400,
        avgPrice: isHigh ? 6.99 : isLow ? 24.99 : 14.50,
        avgReviews: isHigh ? 450 : isLow ? 45 : 120,
        avgRating: 4.3,
        bestsellerCount: isHigh ? 50 : isLow ? 2 : 15
      },
      successfulBookProfile: `Books averaging ${isHigh ? '100' : isLow ? '250' : '150'}+ pages priced around $${isHigh ? '7' : isLow ? '25' : '15'}, featuring highly specific subtitles, strong A+ content, and reviews praising clear, actionable advice.`,
      marketTrend: isHigh ? 'Stable' : isLow ? 'Growing' : 'Growing',
      topKeywords: [
        { word: kw.split(' ')[0] + ' guide', overlap: 85 },
        { word: kw + ' for beginners', overlap: 72 },
        { word: 'best ' + kw, overlap: 64 },
        { word: kw + ' 2027', overlap: 45 },
      ],
      distributions: {
        price: [
          { range: '< $10', percentage: isHigh ? 70 : 10 },
          { range: '$10 - $15', percentage: isHigh ? 20 : 40 },
          { range: '$15 - $20', percentage: isHigh ? 8 : 30 },
          { range: '> $20', percentage: isHigh ? 2 : 20 },
        ],
        rating: [
          { range: '4.5 - 5.0', percentage: 45 },
          { range: '4.0 - 4.4', percentage: 35 },
          { range: '3.5 - 3.9', percentage: 15 },
          { range: '< 3.5', percentage: 5 },
        ],
        publication: [
          { year: '2024', count: isHigh ? 450 : 20 },
          { year: '2025', count: isHigh ? 520 : 35 },
          { year: '2026', count: isHigh ? 610 : 48 },
          { year: '2027 (YTD)', count: isHigh ? 200 : 15 },
        ]
      }
    }
  });
});
