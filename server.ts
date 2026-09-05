import express, { Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { authRouter, ensureDemoUsers } from "./server/auth.ts";
import { dashboardRouter } from "./server/dashboard.ts";
import { nicheRouter } from "./server/niche.ts";
import { booksRouter } from "./server/books.ts";
import { competitionRouter } from "./server/competition.ts";
import { trendsRouter } from "./server/trends.ts";
import { savedRouter } from "./server/saved.ts";
import { aiRouter } from "./server/ai.ts";
import { subscriptionsRouter } from "./server/subscriptions.ts";
import { paymentsRouter } from "./server/payments.ts";
import { adminRouter } from "./server/admin.ts";
import { filesRouter } from "./server/files.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the reverse proxy (required for rate limiting behind a proxy like Nginx or Cloud Run)
  app.set("trust proxy", 1);

  // Compress all responses
  app.use(compression());

  // 1. Security Headers (Helmet)
  // We disable CSP/COEP during development so Vite's HMR and inline styles continue working.
  // In production, these should be hardened.
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. CORS Restriction
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL || true
          : true,
      credentials: true,
    }),
  );

  // 3. Global Rate Limiter (API Abuse Protection)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      success: false,
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", globalLimiter);

  // 4. Strict Body Parsing with Limits (Payload size limit for DoS protection)
  app.use(express.json({ limit: "2mb" })); // Reduced from default to prevent large payload attacks
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Seed demo initial users for instant validation
  await ensureDemoUsers();

  // API Routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      app: "KDP Orbit Intelligence & Publishing Platform",
      version: "1.0.0-prod",
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Auth & Dashboard Routers
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/niche", nicheRouter);
  app.use("/api/books", booksRouter);
  app.use("/api/competition", competitionRouter);
  app.use("/api/trends", trendsRouter);
  app.use("/api/saved", savedRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/files", filesRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler (Exception Handling & Error Monitoring)
  // Ensures stack traces are NEVER leaked to the client in production.
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Log technical details and stack traces privately for developers
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

    // Never expose stack traces or secrets to users
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Something went wrong. We couldn't complete your request right now. Please try again or contact support if the issue persists.",
      },
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KDP Orbit Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
