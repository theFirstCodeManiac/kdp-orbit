import { Router } from 'express';
import { requireAuth } from './auth.ts';

export const booksRouter = Router();

export interface BookData {
  asin: string;
  title: string;
  author: string;
  priceUSD: number;
  rating: number;
  reviewCount: number;
  publishDate: string;
  categories: string[];
  bestSellerRank: number;
  trend: 'Up' | 'Down' | 'Flat';
  estimatedMonthlySales: number;
  revenueEstUSD: number;
}

const mockBooks: BookData[] = [
  { asin: 'B08F7J44Q1', title: 'The Silent Patient', author: 'Alex Michaelides', priceUSD: 14.99, rating: 4.5, reviewCount: 154030, publishDate: '2019-02-05', categories: ['Psychological Thrillers', 'Suspense'], bestSellerRank: 120, trend: 'Up', estimatedMonthlySales: 15000, revenueEstUSD: 224850 },
  { asin: 'B0CH31X322', title: 'Atomic Habits', author: 'James Clear', priceUSD: 11.98, rating: 4.8, reviewCount: 120500, publishDate: '2018-10-16', categories: ['Self-Help', 'Business'], bestSellerRank: 5, trend: 'Flat', estimatedMonthlySales: 45000, revenueEstUSD: 539100 },
  { asin: 'B09JWH3K9Q', title: 'Python Crash Course, 3rd Edition', author: 'Eric Matthes', priceUSD: 29.99, rating: 4.7, reviewCount: 8500, publishDate: '2023-01-10', categories: ['Programming', 'Python'], bestSellerRank: 1500, trend: 'Up', estimatedMonthlySales: 2500, revenueEstUSD: 74975 },
  { asin: 'B07ZP6M3L2', title: 'The Midnight Library', author: 'Matt Haig', priceUSD: 13.50, rating: 4.4, reviewCount: 88200, publishDate: '2020-09-29', categories: ['Contemporary Fiction', 'Fantasy'], bestSellerRank: 450, trend: 'Down', estimatedMonthlySales: 8000, revenueEstUSD: 108000 },
  { asin: 'B015NKQCQU', title: 'A Man Called Ove', author: 'Fredrik Backman', priceUSD: 12.00, rating: 4.7, reviewCount: 76000, publishDate: '2015-05-05', categories: ['Humorous Fiction', 'Literary Fiction'], bestSellerRank: 800, trend: 'Up', estimatedMonthlySales: 5500, revenueEstUSD: 66000 },
  { asin: 'B00XYZ1234', title: 'Low FODMAP Diet for Beginners', author: 'Jane Dietitian', priceUSD: 19.99, rating: 4.2, reviewCount: 150, publishDate: '2023-08-15', categories: ['Health & Diet', 'Cookbooks'], bestSellerRank: 45000, trend: 'Up', estimatedMonthlySales: 350, revenueEstUSD: 6996 },
  { asin: 'B00ABC9876', title: 'Indoor Gardening for Cats', author: 'Feline Friend', priceUSD: 9.99, rating: 4.0, reviewCount: 85, publishDate: '2022-11-20', categories: ['Hobbies', 'Pets'], bestSellerRank: 120000, trend: 'Flat', estimatedMonthlySales: 120, revenueEstUSD: 1198 }
];

booksRouter.post('/search', requireAuth, (req, res) => {
  const { query } = req.body;
  let results = [...mockBooks];
  
  if (query && query.trim() !== '') {
    const q = query.toLowerCase();
    results = results.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) || 
      b.asin.toLowerCase().includes(q) ||
      b.categories.some(c => c.toLowerCase().includes(q))
    );
  }
  
  res.json({ success: true, data: results });
});
