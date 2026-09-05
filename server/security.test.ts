import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import http from "node:http";
import { once } from "node:events";
import crypto from "node:crypto";
import { db } from "./db.ts";
import { authRouter, ensureDemoUsers } from "./auth.ts";
import { savedRouter } from "./saved.ts";
import { filesRouter, fileOwnership } from "./files.ts";
import { paymentsRouter } from "./payments.ts";
import { dashboardRouter } from "./dashboard.ts";
import { adminRouter } from "./admin.ts";
import { booksRouter } from "./books.ts";
import { nicheRouter } from "./niche.ts";
import { resolveUserEntitlements } from "./subscriptions.ts";

async function startTestServer() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use("/api/auth", authRouter);
  app.use("/api/saved", savedRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/books", booksRouter);
  app.use("/api/niche", nicheRouter);

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const { port } = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${port}`;

  return { server, baseUrl };
}

function resetDb() {
  db.users.clear();
  db.sessions.clear();
  db.researchItems.clear();
  db.coverProjects.clear();
  db.billingRecords.clear();
  db.usageRecords.clear();
  db.recentSearches.clear();
  db.paymentTransactions.clear();
  db.webhookEvents.clear();
  db.collections.clear();
  db.savedItems.clear();
  fileOwnership.clear();
}

async function jsonRequest(
  baseUrl: string,
  path: string,
  init: RequestInit & { token?: string; forwardedFor?: string } = {},
) {
  const headers = new Headers(init.headers ?? {});
  if (init.forwardedFor) {
    headers.set("X-Forwarded-For", init.forwardedFor);
  } else {
    headers.set(
      "X-Forwarded-For",
      `10.0.0.${Math.floor(Math.random() * 250) + 5}`,
    );
  }
  if (init.token) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body: init.body ? init.body : undefined,
  });

  const text = await res.text();
  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { res, body };
}

async function registerUser(
  baseUrl: string,
  overrides?: Partial<{
    email: string;
    password: string;
    displayName: string;
    country: string;
    preferredCurrency: string;
  }>,
  forwardedFor?: string,
) {
  const payload = {
    email: overrides?.email ?? "new-user@example.com",
    password: overrides?.password ?? "Password123!",
    displayName: overrides?.displayName ?? "New User",
    country: overrides?.country ?? "NG",
    preferredCurrency: overrides?.preferredCurrency ?? "NGN",
  };

  const result = await jsonRequest(baseUrl, "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    forwardedFor,
  });

  return { ...result, payload };
}

async function loginUser(
  baseUrl: string,
  email: string,
  password: string,
  forwardedFor?: string,
) {
  const result = await jsonRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    forwardedFor,
  });

  return result;
}

describe("critical application security and business logic", () => {
  beforeEach(async () => {
    resetDb();
    await ensureDemoUsers();
  });

  it("authenticates valid users and rejects invalid sessions", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const register = await registerUser(baseUrl, {
        email: "alpha@example.com",
        password: "Password123!",
        displayName: "Alpha User",
      });
      assert.equal(
        register.res.status,
        201,
        "user registration should succeed",
      );
      const token = (register.body as any)?.data?.token;
      assert.ok(token, "registration should return a bearer token");

      const valid = await jsonRequest(baseUrl, "/api/dashboard/overview", {
        method: "GET",
        token,
      });
      assert.equal(valid.res.status, 200);

      const invalid = await jsonRequest(baseUrl, "/api/dashboard/overview", {
        method: "GET",
        token: "bad-token",
      });
      assert.equal(invalid.res.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("requires authentication for protected routes", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const response = await jsonRequest(baseUrl, "/api/dashboard/overview", {
        method: "GET",
      });
      assert.equal(response.res.status, 401);
      assert.equal((response.body as any)?.error?.code, "UNAUTHORIZED");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("blocks cross-user saved item access and admin access", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const userA = await loginUser(
        baseUrl,
        "chidi.author@example.com",
        "AuthorPass2026!",
      );
      const userB = await registerUser(baseUrl, {
        email: "user-b@example.com",
        password: "Password123!",
        displayName: "User B",
      });

      const itemId = "saved-item-1";
      db.savedItems.set(itemId, {
        id: itemId,
        userId: (userB.body as any).data.user.id,
        collectionId: "collection-1",
        type: "keyword",
        title: "User B keyword",
        subtitle: "Private",
        addedAt: new Date().toISOString(),
      });

      const unauthorizedDelete = await jsonRequest(
        baseUrl,
        `/api/saved/items/${itemId}`,
        {
          method: "DELETE",
          token: (userA.body as any).data.token,
        },
      );
      assert.equal(unauthorizedDelete.res.status, 403);
      assert.equal(
        (unauthorizedDelete.body as any)?.error?.message,
        "Forbidden",
      );

      const forbiddenAdmin = await jsonRequest(baseUrl, "/api/admin/stats", {
        method: "GET",
        token: (userA.body as any).data.token,
      });
      assert.equal(forbiddenAdmin.res.status, 403);
      assert.equal((forbiddenAdmin.body as any)?.error?.code, "FORBIDDEN");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("validates subscription entitlements and limits", async () => {
    const freeUser = "free-user";
    db.users.set(freeUser, {
      id: freeUser,
      email: "free@example.com",
      passwordHash: "hash",
      displayName: "Free User",
      role: "author",
      country: "US",
      preferredCurrency: "USD",
      planId: "free_starter",
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });

    const freeEntitlements = resolveUserEntitlements(freeUser);
    assert.equal(freeEntitlements.features.canExportCover, false);
    assert.equal(freeEntitlements.limits.coverExports, 2);

    const paidUser = "paid-user";
    db.billingRecords.set(paidUser, {
      userId: paidUser,
      planId: "author_pro",
      status: "active",
      billingCycle: "monthly",
      trialEndsAt: null,
      promotionalAccess: false,
      lifetimeAccess: false,
      partnerAccount: false,
      adminGrantedAccess: false,
      earlyAdopterAccess: false,
      earlyAccessActivatedAt: null,
      earlyAccessExpiresAt: null,
      auditLog: [],
      currency: "USD",
      currentAmount: 19,
      paymentMethodLast4: "4242",
      nextBillingDate: null,
      invoices: [],
    });

    const paidEntitlements = resolveUserEntitlements(paidUser);
    assert.equal(paidEntitlements.features.canExportCover, true);
    assert.equal(paidEntitlements.limits.aiCredits, 150);
  });

  it("enforces usage ceilings through the dashboard overview", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const user = await registerUser(baseUrl, {
        email: "usage@example.com",
        password: "Password123!",
        displayName: "Usage User",
      });

      const token = (user.body as any).data.token;
      db.usageRecords.set((user.body as any).data.user.id, {
        userId: (user.body as any).data.user.id,
        month: "2026-09",
        keywordSearchesUsed: 14,
        keywordSearchesLimit: 15,
        nicheQueriesUsed: 5,
        nicheQueriesLimit: 5,
        aiCreditsUsed: 5,
        aiCreditsLimit: 5,
        coverExportsUsed: 2,
        coverExportsLimit: 2,
      });

      const overview = await jsonRequest(baseUrl, "/api/dashboard/overview", {
        method: "GET",
        token,
      });

      assert.equal(overview.res.status, 200);
      const usage = (overview.body as any).data.usage;
      assert.equal(usage.keywordSearches.remaining, 1);
      assert.equal(usage.coverExports.remaining, 0);
      assert.ok(usage.aiCredits.percent <= 100);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("rejects invalid payment webhooks and ignores duplicates", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const secret = "test-paystack-secret";
      process.env.PAYSTACK_SECRET_KEY = secret;
      const txId = "tx_1";
      db.paymentTransactions.set(txId, {
        id: txId,
        userId: "user-1",
        provider: "paystack",
        reference: "ref_123",
        planId: "author_pro",
        billingCycle: "monthly",
        amount: 19,
        currency: "USD",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const body = {
        event: "charge.success",
        data: { id: "evt_1", reference: "ref_123", status: "success" },
      };
      const signature = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(body))
        .digest("hex");

      const first = await fetch(`${baseUrl}/api/payments/webhook/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": signature,
        },
        body: JSON.stringify(body),
      });
      assert.equal(first.status, 200);

      const second = await fetch(`${baseUrl}/api/payments/webhook/paystack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-paystack-signature": signature,
        },
        body: JSON.stringify(body),
      });
      assert.equal(second.status, 200);
      assert.ok(db.webhookEvents.has("evt_1"));

      const badSignature = await fetch(
        `${baseUrl}/api/payments/webhook/paystack`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-paystack-signature": "bad-signature",
          },
          body: JSON.stringify(body),
        },
      );
      assert.equal(badSignature.status, 400);
    } finally {
      delete process.env.PAYSTACK_SECRET_KEY;
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("serves research APIs only to authenticated users and returns filtered results", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const register = await registerUser(baseUrl, {
        email: "research@example.com",
        password: "Password123!",
        displayName: "Research User",
      });
      const token = (register.body as any).data.token;

      const bookSearch = await jsonRequest(baseUrl, "/api/books/search", {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "python", page: 1, limit: 5 }),
      });
      assert.equal(bookSearch.res.status, 200);
      assert.ok(Array.isArray((bookSearch.body as any).data));

      const nicheSearch = await jsonRequest(baseUrl, "/api/niche/search", {
        method: "POST",
        token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { demand: "High", competition: "Low" },
          page: 1,
          limit: 5,
        }),
      });
      assert.equal(nicheSearch.res.status, 200);
      assert.ok(Array.isArray((nicheSearch.body as any).data));

      const unauthenticated = await jsonRequest(baseUrl, "/api/books/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "python" }),
      });
      assert.equal(unauthenticated.res.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("isolates database access by user and rejects invalid session attempts", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const userA = await registerUser(baseUrl, {
        email: "db-user-a@example.com",
        password: "Password123!",
        displayName: "User A",
      });
      const userB = await registerUser(baseUrl, {
        email: "db-user-b@example.com",
        password: "Password123!",
        displayName: "User B",
      });

      const userAId = (userA.body as any).data.user.id;
      const userBId = (userB.body as any).data.user.id;

      db.savedItems.set("item-user-a", {
        id: "item-user-a",
        userId: userAId,
        collectionId: "c1",
        type: "keyword",
        title: "A keyword",
        subtitle: "Mine",
        addedAt: new Date().toISOString(),
      });
      db.savedItems.set("item-user-b", {
        id: "item-user-b",
        userId: userBId,
        collectionId: "c2",
        type: "keyword",
        title: "B keyword",
        subtitle: "Private",
        addedAt: new Date().toISOString(),
      });

      const userAItems = await jsonRequest(baseUrl, "/api/saved/items", {
        method: "GET",
        token: (userA.body as any).data.token,
      });
      assert.equal(userAItems.res.status, 200);
      assert.equal((userAItems.body as any).data.length, 1);
      assert.equal((userAItems.body as any).data[0].title, "A keyword");

      const invalidSession = await jsonRequest(baseUrl, "/api/auth/me", {
        method: "GET",
        token: "does-not-exist",
      });
      assert.equal(invalidSession.res.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("rejects executable uploads and enforces file ownership boundaries", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const register = await registerUser(baseUrl, {
        email: "file-user@example.com",
        password: "Password123!",
        displayName: "File User",
      });
      const token = (register.body as any).data.token;

      const exeBody = new FormData();
      exeBody.append(
        "file",
        new Blob(["#!/bin/bash\necho bad"], {
          type: "application/x-msdownload",
        }),
        "virus.exe",
      );
      const rejectedUpload = await fetch(`${baseUrl}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: exeBody,
      });
      assert.equal(rejectedUpload.status, 400);

      const pngBody = new FormData();
      pngBody.append(
        "file",
        new Blob([Uint8Array.from([0x89, 0x50, 0x4e, 0x47])], {
          type: "image/png",
        }),
        "cover.png",
      );
      const acceptedUpload = await fetch(`${baseUrl}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: pngBody,
      });
      const acceptedJson = await acceptedUpload.json();
      assert.equal(acceptedUpload.status, 200);
      assert.equal(acceptedJson.success, true);

      const bannedUser = await registerUser(baseUrl, {
        email: "user-b@example.com",
        password: "Password123!",
        displayName: "User B",
      });
      const userBToken = (bannedUser.body as any).data.token;

      const blocked = await jsonRequest(
        baseUrl,
        `/api/files/${acceptedJson.data.fileId}`,
        {
          method: "GET",
          token: userBToken,
        },
      );
      assert.equal(blocked.res.status, 403);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("rejects invalid input and rate-limited auth attempts", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const weakEmail = await jsonRequest(baseUrl, "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bad-email",
          password: "short",
          displayName: "Bad",
        }),
      });
      assert.equal(weakEmail.res.status, 400);

      const authenticatedUser = await registerUser(baseUrl, {
        email: "quickaction@example.com",
        password: "Password123!",
        displayName: "Quick Action User",
      });

      const badQuery = await jsonRequest(
        baseUrl,
        "/api/dashboard/quick-action",
        {
          method: "POST",
          token: (authenticatedUser.body as any).data.token,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "search",
            query: "x".repeat(300),
          }),
        },
      );
      assert.equal(badQuery.res.status, 400);

      for (let i = 0; i < 11; i += 1) {
        await jsonRequest(baseUrl, "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "WrongPassword",
          }),
          forwardedFor: "10.0.0.42",
        });
      }

      const limited = await jsonRequest(baseUrl, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "WrongPassword",
        }),
        forwardedFor: "10.0.0.42",
      });
      assert.equal(limited.res.status, 429);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("secures admin actions and rejects browser-side subscription modifications", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const user = await registerUser(baseUrl, {
        email: "admin-attempt@example.com",
        password: "Password123!",
        displayName: "Attempt User",
      });
      const token = (user.body as any).data.token;

      const directAdmin = await jsonRequest(baseUrl, "/api/admin/users", {
        method: "GET",
        token,
      });
      assert.equal(directAdmin.res.status, 403);

      const subscriptionChange = await jsonRequest(
        baseUrl,
        "/api/payments/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: "author_pro",
            billingCycle: "monthly",
          }),
        },
      );
      assert.equal(subscriptionChange.res.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
