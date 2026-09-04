import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, DBUser, DBSession } from './db.ts';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kdp-orbit-sec-token-2026-auth';

// Authenticated Request Interface
export interface AuthenticatedRequest extends Request {
  user?: Omit<DBUser, 'passwordHash' | 'resetPasswordToken' | 'emailVerificationToken'>;
  token?: string;
  sessionId?: string;
}

// Authentication Middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please sign in.' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User account no longer exists.' },
      });
      return;
    }

    // Verify session in active sessions
    let activeSession: DBSession | undefined;
    for (const session of db.sessions.values()) {
      if (session.token === token && session.userId === user.id) {
        activeSession = session;
        session.lastActiveAt = new Date().toISOString();
        break;
      }
    }

    if (!activeSession) {
      res.status(401).json({
        success: false,
        error: { code: 'SESSION_REVOKED', message: 'Session has expired or was terminated.' },
      });
      return;
    }

    req.user = db.sanitizeUser(user);
    req.token = token;
    req.sessionId = activeSession.id;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired session token.' },
    });
    return;
  }
}

// Admin Authorization Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // First, verify standard auth
  requireAuth(req, res, () => {
    // Then verify role
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Administrator access required.' }
      });
      return;
    }
    next();
  });
}

// Helper: Seed initial demo user for instant testing if empty
export async function ensureDemoUsers() {
  if (db.users.size === 0) {
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('AuthorPass2026!', salt);

    const user1: DBUser = {
      id: 'usr_demo_nigeria_01',
      email: 'chidi.author@example.com',
      passwordHash: demoPasswordHash,
      displayName: 'Chidi Okafor',
      role: 'author',
      country: 'NG',
      preferredCurrency: 'NGN',
      planId: 'author_pro',
      isEmailVerified: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const user2: DBUser = {
      id: 'usr_demo_global_02',
      email: 'sarah.publisher@example.com',
      passwordHash: demoPasswordHash,
      displayName: 'Sarah Jenkins',
      role: 'pro_publisher',
      country: 'US',
      preferredCurrency: 'USD',
      planId: 'publisher_elite',
      isEmailVerified: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.set(user1.id, user1);
    db.users.set(user2.id, user2);

    // Seed isolated data for User 1
    db.researchItems.set('res_01', {
      id: 'res_01',
      userId: user1.id,
      title: 'African Folktales & Coloring Books for Kids',
      type: 'niche',
      payload: {
        categoryPath: "Books > Children's Books > Geography & Cultures > Africa",
        opportunityScore: 88,
        rating: 'Strong',
        demand: 'High',
        competition: 'Low',
        trend: 'Breakout',
        avgBSR: 14200,
        estimatedRevenueUSD: 1850,
        estimatedRevenueNGN: 2682500,
        dailySalesTop10: 24,
        avgPriceUSD: 8.99,
        notes: 'High organic search volume on Amazon US & UK, very few high-quality illustrated titles from native African creators.'
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    db.researchItems.set('res_01b', {
      id: 'res_01b',
      userId: user1.id,
      title: 'Daily Prayer & Gratitude Journal for Christian Men',
      type: 'niche',
      payload: {
        categoryPath: 'Books > Christian Books & Bibles > Christian Living > Spiritual Growth',
        opportunityScore: 82,
        rating: 'Viable',
        demand: 'Very High',
        competition: 'Moderate',
        trend: 'Growing',
        avgBSR: 8900,
        estimatedRevenueUSD: 3100,
        estimatedRevenueNGN: 4495000,
        dailySalesTop10: 38,
        avgPriceUSD: 10.99,
        notes: 'Sub-niche with strong Father\'s Day and Q4 holiday surge.'
      },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    });

    db.researchItems.set('res_01c', {
      id: 'res_01c',
      userId: user1.id,
      title: 'Yoruba & Igbo Language Picture Dictionary for Toddlers',
      type: 'niche',
      payload: {
        categoryPath: "Books > Children's Books > Early Learning > Basic Concepts",
        opportunityScore: 92,
        rating: 'Exceptional',
        demand: 'High',
        competition: 'Very Low',
        trend: 'Breakout',
        avgBSR: 18400,
        estimatedRevenueUSD: 1450,
        estimatedRevenueNGN: 2102500,
        dailySalesTop10: 16,
        avgPriceUSD: 9.99,
        notes: 'Diaspora Nigerian parents in US, UK, and Canada actively searching with zero dominant competitors.'
      },
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    });

    // Seed recent searches for User 1
    db.recentSearches.set('sea_01', {
      id: 'sea_01',
      userId: user1.id,
      query: 'african folktales kids coloring book',
      type: 'keyword',
      resultsCount: 384,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    });
    db.recentSearches.set('sea_02', {
      id: 'sea_02',
      userId: user1.id,
      query: 'Christian prayer journal for men 2026',
      type: 'keyword',
      resultsCount: 1240,
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    });
    db.recentSearches.set('sea_03', {
      id: 'sea_03',
      userId: user1.id,
      query: 'Igbo language toddler flashcards paperback',
      type: 'niche',
      resultsCount: 88,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    });
    db.recentSearches.set('sea_04', {
      id: 'sea_04',
      userId: user1.id,
      query: 'B08F1V4W9K (Bestseller Competitor Reverse Lookup)',
      type: 'book',
      resultsCount: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    });

    // Seed cover projects for User 1
    db.coverProjects.set('cov_01', {
      id: 'cov_01',
      userId: user1.id,
      title: 'Anansi & Friends: West African Tales Coloring Book',
      trimSize: '8.5 x 11 in',
      pageCount: 84,
      paperType: 'white',
      spineWidthInches: 0.189,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    });
    db.coverProjects.set('cov_02', {
      id: 'cov_02',
      userId: user1.id,
      title: 'The Guided Men’s War Room Devotional 2026',
      trimSize: '6 x 9 in',
      pageCount: 140,
      paperType: 'cream',
      spineWidthInches: 0.35,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    });

    // Seed usage quota for User 1 (Author Pro: 250 keywords, 100 niches, 150 AI, 25 covers)
    db.usageRecords.set(user1.id, {
      userId: user1.id,
      month: '2026-09',
      keywordSearchesUsed: 38,
      keywordSearchesLimit: 250,
      nicheQueriesUsed: 14,
      nicheQueriesLimit: 100,
      aiCreditsUsed: 42,
      aiCreditsLimit: 150,
      coverExportsUsed: 3,
      coverExportsLimit: 25,
    });

    db.billingRecords.set(user1.id, {
      userId: user1.id,
      planId: 'author_pro',
      status: 'active',
      billingCycle: 'monthly',
      trialEndsAt: null,
      promotionalAccess: false,
      lifetimeAccess: false,
      partnerAccount: false,
      adminGrantedAccess: false,
      earlyAdopterAccess: false,
      earlyAccessActivatedAt: null,
      earlyAccessExpiresAt: null,
      auditLog: [],
      currency: 'NGN',
      currentAmount: 12500,
      paymentMethodLast4: '4190',
      nextBillingDate: '2026-10-01',
      invoices: [{ id: 'inv_101', date: '2026-09-01', amount: 12500, currency: 'NGN', status: 'paid' }],
    });

    // Seed isolated data for User 2
    db.researchItems.set('res_02', {
      id: 'res_02',
      userId: user2.id,
      title: 'High-Ticket Sudoku & Logic Grid Puzzles',
      type: 'keyword',
      payload: { bsr: 6500, estimatedRevenueUSD: 4200 },
      createdAt: new Date().toISOString(),
    });

    db.recentSearches.set('sea_05', {
      id: 'sea_05',
      userId: user2.id,
      query: 'extreme hard sudoku large print for seniors',
      type: 'keyword',
      resultsCount: 840,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    });

    db.coverProjects.set('cov_03', {
      id: 'cov_03',
      userId: user2.id,
      title: 'Zen Logic: 500 Cryptic Grids',
      trimSize: '8.5 x 11 in',
      pageCount: 220,
      paperType: 'white',
      spineWidthInches: 0.495,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    db.usageRecords.set(user2.id, {
      userId: user2.id,
      month: '2026-09',
      keywordSearchesUsed: 185,
      keywordSearchesLimit: 1000,
      nicheQueriesUsed: 80,
      nicheQueriesLimit: 500,
      aiCreditsUsed: 320,
      aiCreditsLimit: 1000,
      coverExportsUsed: 14,
      coverExportsLimit: 100,
    });

    db.billingRecords.set(user2.id, {
      userId: user2.id,
      planId: 'publisher_elite',
      status: 'active',
      billingCycle: 'monthly',
      trialEndsAt: null,
      promotionalAccess: false,
      lifetimeAccess: false,
      partnerAccount: false,
      adminGrantedAccess: false,
      earlyAdopterAccess: false,
      earlyAccessActivatedAt: null,
      earlyAccessExpiresAt: null,
      auditLog: [],
      currency: 'USD',
      currentAmount: 34.99,
      paymentMethodLast4: '8812',
      nextBillingDate: '2026-10-01',
      invoices: [{ id: 'inv_201', date: '2026-09-01', amount: 34.99, currency: 'USD', status: 'paid' }],
    });
  }
}

import { rateLimit } from 'express-rate-limit';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests from this IP, please try again after 15 minutes' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email validation helper
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 1. REGISTER
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName, country, preferredCurrency } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email, password, and name are required.' },
      });
      return;
    }
    
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' },
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' },
      });
      return;
    }

    if (db.findUserByEmail(email)) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists.' },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const newUser: DBUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim(),
      role: email.toLowerCase().trim() === 'danielidah608@gmail.com' ? 'admin' : 'author',
      country: country || 'NG',
      preferredCurrency: preferredCurrency || (country === 'NG' ? 'NGN' : 'USD'),
      planId: 'free_starter',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.set(newUser.id, newUser);

    // Initialize usage quota
    db.usageRecords.set(userId, {
      userId,
      month: new Date().toISOString().slice(0, 7),
      keywordSearchesUsed: 0,
      keywordSearchesLimit: 15,
      nicheQueriesUsed: 0,
      nicheQueriesLimit: 5,
      aiCreditsUsed: 0,
      aiCreditsLimit: 5,
      coverExportsUsed: 0,
      coverExportsLimit: 2,
    });

    // Create session
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const sessionId = 'ses_' + crypto.randomBytes(8).toString('hex');

    const session: DBSession = {
      id: sessionId,
      userId: newUser.id,
      token,
      userAgent: req.headers['user-agent'] || 'Unknown Browser',
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    db.sessions.set(session.id, session);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. A verification token has been assigned.',
      data: {
        user: db.sanitizeUser(newUser),
        token,
        verificationToken, // Provided in development/demo mode for rapid email verification
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// 2. LOGIN
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' },
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' },
      });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    if (email.toLowerCase().trim() === 'danielidah608@gmail.com') {
      user.role = 'admin';
    }
    user.lastLoginAt = new Date().toISOString();

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const sessionId = 'ses_' + crypto.randomBytes(8).toString('hex');

    const session: DBSession = {
      id: sessionId,
      userId: user.id,
      token,
      userAgent: req.headers['user-agent'] || 'Unknown Browser',
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    db.sessions.set(session.id, session);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        user: db.sanitizeUser(user),
        token,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// 3. LOGOUT (Terminates current session)
authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.sessionId) {
    db.sessions.delete(req.sessionId);
  }
  res.json({ success: true, message: 'Signed out successfully.' });
});

// 4. GET CURRENT AUTHENTICATED USER & SESSIONS
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const userSessions = Array.from(db.sessions.values())
    .filter((s) => s.userId === user.id)
    .map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.id === req.sessionId,
    }));

  res.json({
    success: true,
    data: {
      user,
      sessions: userSessions,
    },
  });
});

// 5. UPDATE PROFILE
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const { displayName, country, preferredCurrency } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (country) user.country = country;
  if (preferredCurrency) user.preferredCurrency = preferredCurrency;
  user.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: db.sanitizeUser(user) },
  });
});

// 6. UPDATE PASSWORD
authRouter.put('/password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Current and new password are required.' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' },
    });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters long.' },
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  user.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Password updated successfully.' });
});

// 7. TERMINATE SPECIFIC SESSION
authRouter.delete('/sessions/:sessionId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) {
    res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Session not found.' } });
    return;
  }

  // Server-side isolation: Cannot terminate another user's session
  if (session.userId !== req.user!.id) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You are not authorized to terminate another user’s session.' },
    });
    return;
  }

  db.sessions.delete(session.id);
  res.json({ success: true, message: 'Session terminated successfully.' });
});

// 8. FORGOT PASSWORD (INITIATE RESET)
authRouter.post('/forgot-password', authRateLimiter, (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'A valid email is required.' } });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // Return standard generic message to prevent email enumeration attacks
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset token has been issued.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset token has been issued.',
    devToken: resetToken, // Exposed in development/demo mode for rapid workflow completion
  });
});

// 9. RESET PASSWORD (COMPLETE RESET)
authRouter.post('/reset-password', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Token and new password are required.' },
    });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' },
    });
    return;
  }

  let matchedUser: DBUser | undefined;
  for (const user of db.users.values()) {
    if (user.resetPasswordToken === token && user.resetPasswordExpires && user.resetPasswordExpires > Date.now()) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset token is invalid or has expired.' },
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  matchedUser.passwordHash = await bcrypt.hash(newPassword, salt);
  matchedUser.resetPasswordToken = null;
  matchedUser.resetPasswordExpires = null;
  matchedUser.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Password reset successfully. You may now sign in.' });
});

// 10. VERIFY EMAIL
authRouter.post('/verify-email', authRateLimiter, (req: Request, res: Response): void => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, error: { code: 'TOKEN_REQUIRED', message: 'Verification token required.' } });
    return;
  }

  let matchedUser: DBUser | undefined;
  for (const user of db.users.values()) {
    if (user.emailVerificationToken === token) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired email verification token.' },
    });
    return;
  }

  matchedUser.isEmailVerified = true;
  matchedUser.emailVerificationToken = null;

  res.json({
    success: true,
    message: 'Email verified successfully.',
    data: { user: db.sanitizeUser(matchedUser) },
  });
});

// 11. DELETE ACCOUNT (With Cascade Deletion & Password Verification)
authRouter.delete('/account', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({
      success: false,
      error: { code: 'PASSWORD_REQUIRED', message: 'Password is required to confirm account deletion.' },
    });
    return;
  }

  const user = db.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'Password incorrect. Account deletion rejected.' },
    });
    return;
  }

  db.deleteUserCascade(user.id);
  res.json({
    success: true,
    message: 'Account, associated research, covers, and active sessions have been permanently deleted.',
  });
});

// 12. EXPLICIT SERVER-SIDE AUTHORIZATION TEST ENDPOINT
// Proves strictly that a user CANNOT access another user's research, billing, or covers.
authRouter.get('/test-isolation/:targetUserId', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.targetUserId;

  if (currentUserId !== targetUserId && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      serverSideGuarded: true,
      error: {
        code: 'FORBIDDEN_RESOURCE_ACCESS',
        message: `Cross-Tenant Access Violation Blocked. Authenticated user (${currentUserId}) is strictly forbidden from accessing private data belonging to user (${targetUserId}).`,
      },
    });
    return;
  }

  // If matched or admin, returns the data
  const targetUser = db.findUserById(targetUserId);
  const targetResearch = Array.from(db.researchItems.values()).filter((r) => r.userId === targetUserId);
  const targetBilling = db.billingRecords.get(targetUserId);

  res.json({
    success: true,
    serverSideGuarded: true,
    data: {
      user: targetUser ? db.sanitizeUser(targetUser) : null,
      researchCount: targetResearch.length,
      billing: targetBilling || null,
    },
  });
});
