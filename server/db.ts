/**
 * Server-side in-memory database store with relationship cascading and isolation.
 * Encapsulates users, sessions, saved research, covers, billing, and usage.
 */

export interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'author' | 'pro_publisher' | 'agency' | 'admin';
  country: string;
  preferredCurrency: 'NGN' | 'USD' | 'GBP';
  planId: 'free_starter' | 'author_pro' | 'publisher_elite';
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: number | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface DBSession {
  id: string;
  userId: string;
  token: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface DBResearchItem {
  id: string;
  userId: string;
  title: string;
  type: 'keyword' | 'niche' | 'competitor';
  payload: any;
  createdAt: string;
}

export interface DBCoverProject {
  id: string;
  userId: string;
  title: string;
  trimSize: string;
  pageCount: number;
  paperType: 'white' | 'cream' | 'color';
  spineWidthInches: number;
  createdAt: string;
}

export interface DBBillingInfo {
  userId: string;
  planId: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | 'none';
  trialEndsAt: string | null;
  promotionalAccess: boolean;
  lifetimeAccess: boolean;
  partnerAccount: boolean;
  adminGrantedAccess: boolean;
  earlyAdopterAccess: boolean;
  
  // Early Access / Premium Period fields
  earlyAccessActivatedAt: string | null;
  earlyAccessExpiresAt: string | null;
  
  auditLog: Array<{
    date: string;
    action: string;
    details: string;
  }>;

  currency: 'NGN' | 'USD';
  currentAmount: number;
  paymentMethodLast4: string;
  nextBillingDate: string | null;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending';
  }>;
}

export interface DBUsageQuota {
  userId: string;
  month: string;
  keywordSearchesUsed: number;
  keywordSearchesLimit: number;
  nicheQueriesUsed: number;
  nicheQueriesLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  coverExportsUsed: number;
  coverExportsLimit: number;
}

export interface DBRecentSearch {
  id: string;
  userId: string;
  query: string;
  type: 'keyword' | 'niche' | 'book';
  resultsCount: number;
  timestamp: string;
}

export interface DBPaymentTransaction {
  id: string;
  userId: string;
  provider: string; // 'stripe', 'paystack', 'mock'
  reference: string;
  planId: string;
  billingCycle: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface DBWebhookEvent {
  eventId: string;
  provider: string;
  eventType: string;
  processedAt: string;
}

export interface DBCollection {
  id: string;
  userId: string;
  name: string;
  itemCount: number;
  updatedAt: string;
}

export interface DBSavedItem {
  id: string;
  userId: string;
  collectionId: string;
  type: 'keyword' | 'niche' | 'book' | 'report' | 'project';
  title: string;
  subtitle: string;
  addedAt: string;
  meta?: any;
}

class InMemoryDatabase {
  public users: Map<string, DBUser> = new Map();
  public sessions: Map<string, DBSession> = new Map();
  public researchItems: Map<string, DBResearchItem> = new Map();
  public coverProjects: Map<string, DBCoverProject> = new Map();
  public billingRecords: Map<string, DBBillingInfo> = new Map();
  public usageRecords: Map<string, DBUsageQuota> = new Map();
  public recentSearches: Map<string, DBRecentSearch> = new Map();
  
  public paymentTransactions: Map<string, DBPaymentTransaction> = new Map();
  public webhookEvents: Map<string, DBWebhookEvent> = new Map();

  public collections: Map<string, DBCollection> = new Map();
  public savedItems: Map<string, DBSavedItem> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // We will initialize with safe demo users if needed or keep clean.
  }

  public findUserByEmail(email: string): DBUser | undefined {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return undefined;
  }

  public findUserById(id: string): DBUser | undefined {
    return this.users.get(id);
  }

  public sanitizeUser(user: DBUser): Omit<DBUser, 'passwordHash' | 'resetPasswordToken' | 'emailVerificationToken'> {
    const { passwordHash, resetPasswordToken, emailVerificationToken, ...safeUser } = user;
    return safeUser;
  }

  public deleteUserCascade(userId: string): boolean {
    if (!this.users.has(userId)) return false;

    // Delete user
    this.users.delete(userId);

    // Cascade delete active sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }

    // Cascade delete saved research
    for (const [id, item] of this.researchItems.entries()) {
      if (item.userId === userId) {
        this.researchItems.delete(id);
      }
    }

    // Cascade delete covers
    for (const [id, cover] of this.coverProjects.entries()) {
      if (cover.userId === userId) {
        this.coverProjects.delete(id);
      }
    }

    // Cascade delete billing
    this.billingRecords.delete(userId);

    // Cascade delete usage
    this.usageRecords.delete(userId);

    // Cascade delete recent searches
    for (const [id, search] of this.recentSearches.entries()) {
      if (search.userId === userId) {
        this.recentSearches.delete(id);
      }
    }

    return true;
  }
}

export const db = new InMemoryDatabase();
