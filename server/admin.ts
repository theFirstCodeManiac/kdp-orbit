import express, { Response } from 'express';
import { requireAdmin, AuthenticatedRequest } from './auth.ts';
import { db } from './db.ts';

export const adminRouter = express.Router();

// 1. Get System Stats
adminRouter.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = (await db.getUserCount());
  let activeSubscriptions = 0;
  let totalRevenue = 0;

  for (const billing of (await db.getAllBillingRecords())) {
    if (billing.status === 'active' && billing.planId !== 'free_starter') {
      activeSubscriptions++;
      // Rough revenue estimate ignoring currency conversions for simplicity
      totalRevenue += billing.currentAmount;
    }
  }

  const recentUsers = Array.from((await db.getAllUsers()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(u => db.sanitizeUser(u));

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeSubscriptions,
        totalRevenue,
      },
      recentUsers
    }
  });
});

// 2. Get All Users
adminRouter.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const allUsers = await db.getAllUsers();
  const users = await Promise.all(Array.from(allUsers).map(async (u) => {
    const billing = await db.getBillingRecord(u.id);
    return {
      ...db.sanitizeUser(u),
      billing: billing || null
    };
    }));
  
  res.json({ success: true, data: { users } });
});

// 3. Admin User Action: Update Subscription / Grant Access
adminRouter.post('/users/:id/subscription', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = req.params.id;
  const { action, days } = req.body; // action: 'grant_early_access', 'grant_lifetime', 'revoke_access'

  if (typeof targetUserId !== 'string' || targetUserId.trim() === '') {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  if (typeof action !== 'string' || !['grant_early_access', 'grant_lifetime', 'revoke_access'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  const user = await db.findUserById(targetUserId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  let billing = await db.getBillingRecord(targetUserId);
  if (!billing) {
    billing = {
      userId: targetUserId,
      planId: 'free_starter',
      status: 'active',
      billingCycle: 'none' as any,
      trialEndsAt: null,
      promotionalAccess: false,
      lifetimeAccess: false,
      partnerAccount: false,
      adminGrantedAccess: false,
      earlyAdopterAccess: false,
      earlyAccessActivatedAt: null,
      earlyAccessExpiresAt: null,
      auditLog: [],
      currency: 'USD' as any,
      currentAmount: 0,
      paymentMethodLast4: '0000',
      nextBillingDate: null,
      invoices: []
    };
    await db.setBillingRecord(targetUserId, billing);
  }

  if (action === 'grant_early_access') {
    const actDate = new Date();
    const expDate = new Date(actDate.getTime() + (days || 30) * 86400000);
    billing.earlyAccessActivatedAt = actDate.toISOString();
    billing.earlyAccessExpiresAt = expDate.toISOString();
    billing.auditLog.push({
      date: actDate.toISOString(),
      action: 'ADMIN_EARLY_ACCESS_GRANTED',
      details: `Admin granted ${days || 30} days early access.`
    });
  } else if (action === 'grant_lifetime') {
    billing.lifetimeAccess = true;
    billing.partnerAccount = true;
    billing.auditLog.push({
      date: new Date().toISOString(),
      action: 'ADMIN_LIFETIME_GRANTED',
      details: `Admin granted lifetime partner access.`
    });
  } else if (action === 'revoke_access') {
    billing.lifetimeAccess = false;
    billing.partnerAccount = false;
    billing.promotionalAccess = false;
    billing.adminGrantedAccess = false;
    billing.earlyAccessActivatedAt = null;
    billing.earlyAccessExpiresAt = null;
    billing.planId = 'free_starter';
    billing.auditLog.push({
      date: new Date().toISOString(),
      action: 'ADMIN_ACCESS_REVOKED',
      details: `Admin revoked premium access.`
    });
  } else {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  res.json({ success: true, message: 'Subscription updated successfully', data: { billing } });
});

// 4. Get System Audit Logs
adminRouter.get('/audit-logs', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const allLogs: any[] = [];
  
  for (const billing of (await db.getAllBillingRecords())) {
    if (billing.auditLog && billing.auditLog.length > 0) {
      for (const log of billing.auditLog) {
        allLogs.push({
          userId: billing.userId,
          userEmail: (await db.findUserById(billing.userId))?.email || 'Unknown',
          ...log
        });
      }
    }
  }

  // Sort newest first
  allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ success: true, data: { logs: allLogs } });
});
