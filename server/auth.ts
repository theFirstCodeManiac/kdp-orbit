import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as nodemailer from "nodemailer";
import { db, DBUser, DBSession } from "./db.ts";

export const authRouter = express.Router();

let transporter: nodemailer.Transporter | null = null;

async function setupMailer() {
  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP_USER and SMTP_PASS (or SMTP_URL) are required in production.",
      );
    }

    // Automatically use Ethereal for testing "real" email flow locally
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("No SMTP_URL provided. Using Ethereal Email for testing.");
  }
}

// Fire-and-forget setup
setupMailer().catch(console.error);

async function sendVerificationEmail(email: string, code: string) {
  if (!transporter) return;

  const mailOptions = {
    from: `"Idah Daniel - Founder/CEO - KDP Orbit" <${process.env.SMTP_USER || "danielidah608@gmail.com"}>`,
    to: email,
    subject: "Verify your KDP Orbit Account",
    text: `Your verification code is: ${code}`,
    html: `<div style="font-family: sans-serif; max-w-lg">
      <h2>Welcome to KDP Orbit!</h2>
      <p>Your 6-digit email verification code is:</p>
      <h1 style="letter-spacing: 0.25em; background: #f3f4f6; padding: 10px; border-radius: 8px; display: inline-block;">${code}</h1>
      <p>Enter this code in the app to complete your registration.</p>
    </div>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if (!process.env.SMTP_URL) {
      console.log("Verification email sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

function resolveTokenFromRequest(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const cookiePair of cookieHeader.split(";")) {
    const [key, ...rest] = cookiePair.trim().split("=");
    if (key === "kdp_orbit_token") {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : undefined;
    }
  }

  return undefined;
}

const JWT_SECRET = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production.",
    );
  }

  return crypto.randomBytes(32).toString("hex");
})();

const exposeDemoTokens =
  process.env.NODE_ENV !== "production" &&
  process.env.ALLOW_DEMO_TOKENS === "true";

// Authenticated Request Interface
export interface AuthenticatedRequest extends Request {
  user?: Omit<
    DBUser,
    "passwordHash" | "resetPasswordToken" | "emailVerificationToken"
  >;
  token?: string;
  sessionId?: string;
}

// Authentication Middleware
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = resolveTokenFromRequest(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please sign in.",
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account no longer exists.",
        },
      });
      return;
    }

    // Verify session in active sessions
    let activeSession: DBSession | undefined;
    for (const session of (await db.getAllSessions())) {
      if (session.token === token && session.userId === user.id) {
        activeSession = session;
        session.lastActiveAt = new Date().toISOString();
        break;
      }
    }

    if (!activeSession) {
      res.status(401).json({
        success: false,
        error: {
          code: "SESSION_REVOKED",
          message: "Session has expired or was terminated.",
        },
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
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired session token.",
      },
    });
    return;
  }
}

// Admin Authorization Middleware
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // First, verify standard auth
  requireAuth(req, res, () => {
    // Then verify role
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Administrator access required." },
      });
      return;
    }
    next();
  });
}

// Helper: Seed initial demo user for instant testing if empty
export async function ensureDemoUsers() {
  // Demo users have been removed for production readiness.
  // The database will now be completely empty on initialization.
}

import { rateLimit } from "express-rate-limit";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT",
      message:
        "Too many requests from this IP, please try again after 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email validation helper
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 1. REGISTER
authRouter.post(
  "/register",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, displayName, country, preferredCurrency } =
        req.body;

      if (!email || !password || !displayName) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_FIELDS",
            message: "Email, password, and name are required.",
          },
        });
        return;
      }

      if (!isValidEmail(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "Please provide a valid email address.",
          },
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 8 characters long.",
          },
        });
        return;
      }

      if (await db.findUserByEmail(email)) {
        res.status(409).json({
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "An account with this email address already exists.",
          },
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userId = "usr_" + crypto.randomBytes(8).toString("hex");
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

      const newUser: DBUser = {
        id: userId,
        email: email.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
        role:
          email.toLowerCase().trim() === "danielidah608@gmail.com"
            ? "admin"
            : "author",
        country: country || "NG",
        preferredCurrency:
          preferredCurrency || (country === "NG" ? "NGN" : "USD"),
        planId: "free_starter",
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await db.setUser(newUser);

      // Initialize usage quota
      await db.setUsageRecord(userId, {
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
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      const sessionId = "ses_" + crypto.randomBytes(8).toString("hex");

      const session: DBSession = {
        id: sessionId,
        userId: newUser.id,
        token,
        userAgent: req.headers["user-agent"] || "Unknown Browser",
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          "127.0.0.1",
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      await db.setSession(session);

      res.cookie("kdp_orbit_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Send real email verification
      await sendVerificationEmail(newUser.email, verificationToken);

      res.status(201).json({
        success: true,
        message:
          "Account created successfully. A verification token has been assigned.",
        data: {
          user: db.sanitizeUser(newUser),
          token,
          ...(exposeDemoTokens ? { verificationToken } : {}),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message },
      });
    }
  },
);

// 2. LOGIN
authRouter.post(
  "/login",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: "Email and password are required.",
          },
        });
        return;
      }

      if (!isValidEmail(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "Please provide a valid email address.",
          },
        });
        return;
      }

      const user = await db.findUserByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
        return;
      }

      if (email.toLowerCase().trim() === "danielidah608@gmail.com") {
        user.role = "admin";
      }
      user.lastLoginAt = new Date().toISOString();

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      const sessionId = "ses_" + crypto.randomBytes(8).toString("hex");

      const session: DBSession = {
        id: sessionId,
        userId: user.id,
        token,
        userAgent: req.headers["user-agent"] || "Unknown Browser",
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress ||
          "127.0.0.1",
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      await db.setSession(session);

      res.cookie("kdp_orbit_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: "Signed in successfully.",
        data: {
          user: db.sanitizeUser(user),
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message },
      });
    }
  },
);

// 3. LOGOUT (Terminates current session)
authRouter.post(
  "/logout",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    if (req.sessionId) {
      await db.deleteSession(req.sessionId);
    }

    res.clearCookie("kdp_orbit_token", { path: "/" });
    res.json({ success: true, message: "Signed out successfully." });
  },
);

// 4. GET CURRENT AUTHENTICATED USER & SESSIONS
authRouter.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const userSessions = Array.from((await db.getAllSessions()))
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
  },
);

// 5. UPDATE PROFILE
authRouter.put(
  "/profile",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });
      return;
    }

    const { displayName, country, preferredCurrency } = req.body;
    if (displayName) user.displayName = displayName.trim();
    if (country) user.country = country;
    if (preferredCurrency) user.preferredCurrency = preferredCurrency;
    user.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: db.sanitizeUser(user) },
    });
  },
);

// 6. UPDATE PASSWORD
authRouter.put(
  "/password",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await db.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Current and new password are required.",
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect.",
        },
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "New password must be at least 8 characters long.",
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date().toISOString();

    res.json({ success: true, message: "Password updated successfully." });
  },
);

// 7. TERMINATE SPECIFIC SESSION
authRouter.delete(
  "/sessions/:sessionId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const session = await db.getSession(req.params.sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: "SESSION_NOT_FOUND", message: "Session not found." },
      });
      return;
    }

    // Server-side isolation: Cannot terminate another user's session
    if (session.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "You are not authorized to terminate another user’s session.",
        },
      });
      return;
    }

    await db.deleteSession(session.id);
    res.json({ success: true, message: "Session terminated successfully." });
  },
);

// 8. FORGOT PASSWORD (INITIATE RESET)
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "A valid email is required.",
        },
      });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      // Return standard generic message to prevent email enumeration attacks
      res.json({
        success: true,
        message:
          "If an account exists with this email, a password reset token has been issued.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    res.json({
      success: true,
      message:
        "If an account exists with this email, a password reset token has been issued.",
      ...(exposeDemoTokens ? { devToken: resetToken } : {}),
    });
  },
);

// 9. RESET PASSWORD (COMPLETE RESET)
authRouter.post(
  "/reset-password",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Token and new password are required.",
        },
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters long.",
        },
      });
      return;
    }

    let matchedUser: DBUser | undefined;
    for (const user of (await db.getAllUsers())) {
      if (
        user.resetPasswordToken === token &&
        user.resetPasswordExpires &&
        user.resetPasswordExpires > Date.now()
      ) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_OR_EXPIRED_TOKEN",
          message: "Password reset token is invalid or has expired.",
        },
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    matchedUser.passwordHash = await bcrypt.hash(newPassword, salt);
    matchedUser.resetPasswordToken = null;
    matchedUser.resetPasswordExpires = null;
    matchedUser.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Password reset successfully. You may now sign in.",
    });
  },
);

// 10. VERIFY EMAIL
authRouter.post(
  "/verify-email",
  authRateLimiter,
  async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({
        success: false,
        error: {
          code: "TOKEN_REQUIRED",
          message: "Verification token required.",
        },
      });
      return;
    }

    let matchedUser: DBUser | undefined;
    for (const user of (await db.getAllUsers())) {
      if (user.emailVerificationToken === token) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired email verification token.",
        },
      });
      return;
    }

    matchedUser.isEmailVerified = true;
    matchedUser.emailVerificationToken = null;

    res.json({
      success: true,
      message: "Email verified successfully.",
      data: { user: db.sanitizeUser(matchedUser) },
    });
  },
);

// 11. DELETE ACCOUNT (With Cascade Deletion & Password Verification)
authRouter.delete(
  "/account",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({
        success: false,
        error: {
          code: "PASSWORD_REQUIRED",
          message: "Password is required to confirm account deletion.",
        },
      });
      return;
    }

    const user = await db.findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found." },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_PASSWORD",
          message: "Password incorrect. Account deletion rejected.",
        },
      });
      return;
    }

    await db.deleteUserCascade(user.id);
    res.json({
      success: true,
      message:
        "Account, associated research, covers, and active sessions have been permanently deleted.",
    });
  },
);

// 12. EXPLICIT SERVER-SIDE AUTHORIZATION TEST ENDPOINT
// Proves strictly that a user CANNOT access another user's research, billing, or covers.
authRouter.get(
  "/test-isolation/:targetUserId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Route unavailable in production.",
        },
      });
      return;
    }

    const currentUserId = req.user!.id;
    const targetUserId = req.params.targetUserId;

    if (currentUserId !== targetUserId && req.user!.role !== "admin") {
      res.status(403).json({
        success: false,
        serverSideGuarded: true,
        error: {
          code: "FORBIDDEN_RESOURCE_ACCESS",
          message: `Cross-Tenant Access Violation Blocked. Authenticated user (${currentUserId}) is strictly forbidden from accessing private data belonging to user (${targetUserId}).`,
        },
      });
      return;
    }

    // If matched or admin, returns the data
    const targetUser = await db.findUserById(targetUserId);
    const targetResearch = Array.from((await db.getAllResearchItems())).filter(
      (r) => r.userId === targetUserId,
    );
    const targetBilling = await db.getBillingRecord(targetUserId);

    res.json({
      success: true,
      serverSideGuarded: true,
      data: {
        user: targetUser ? db.sanitizeUser(targetUser) : null,
        researchCount: targetResearch.length,
        billing: targetBilling || null,
      },
    });
  },
);
