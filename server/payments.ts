import express, { Request, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "./auth.ts";
import { db, DBPaymentTransaction } from "./db.ts";
import { availablePlans } from "./subscriptions.ts";
import crypto from "crypto";

export const paymentsRouter = express.Router();

/**
 * ARCHITECTURE:
 * We use an abstract IPaymentProvider interface so the platform can seamlessly
 * swap out Stripe, Paystack, Flutterwave, Paddle, or custom providers.
 *
 * - Currently using ONLY Paystack for all users as requested.
 */

interface PaymentCheckoutResult {
  checkoutUrl: string;
  reference: string;
}

interface IPaymentProvider {
  name: string;
  createCheckoutSession(
    userId: string,
    email: string,
    planId: string,
    billingCycle: string,
    amount: number,
    currency: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<PaymentCheckoutResult>;
  verifyPayment(reference: string): Promise<boolean>;
  handleWebhook(
    req: Request,
  ): Promise<{
    eventId: string;
    type: string;
    reference: string;
    status: string;
  } | null>;
}

// -------------------------------------------------------------
// 1. PAYSTACK PROVIDER IMPLEMENTATION (For ALL users currently)
// -------------------------------------------------------------
class PaystackProvider implements IPaymentProvider {
  name = "paystack";

  async createCheckoutSession(
    userId: string,
    email: string,
    planId: string,
    billingCycle: string,
    amount: number,
    currency: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<PaymentCheckoutResult> {
    if (!process.env.PAYSTACK_SECRET_KEY)
      return this.mockCheckout(userId, planId, billingCycle, successUrl);

    const ref = `ps_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Convert to minor units (Kobo for NGN, Cents for USD)
    const amountInMinor = Math.round(amount * 100);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInMinor,
          currency,
          reference: ref,
          callback_url: `${successUrl}?reference=${ref}`,
          metadata: { userId, planId, billingCycle },
        }),
      },
    );

    const data = await response.json();
    if (!data.status) throw new Error(data.message);

    return { checkoutUrl: data.data.authorization_url, reference: ref };
  }

  async verifyPayment(reference: string): Promise<boolean> {
    if (!process.env.PAYSTACK_SECRET_KEY) return true; // mock mode
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );
      const data = await response.json();
      return data.status && data.data.status === "success";
    } catch (e) {
      return false;
    }
  }

  async handleWebhook(
    req: Request,
  ): Promise<{
    eventId: string;
    type: string;
    reference: string;
    status: string;
  } | null> {
    if (!process.env.PAYSTACK_SECRET_KEY) return null;

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash !== req.headers["x-paystack-signature"])
      throw new Error("Invalid signature");

    const event = req.body;
    if (event.event === "charge.success") {
      return {
        eventId: event.data.id.toString(),
        type: event.event,
        reference: event.data.reference,
        status: "successful",
      };
    }

    return null;
  }

  private async mockCheckout(
    userId: string,
    planId: string,
    billingCycle: string,
    successUrl: string,
  ) {
    const ref = `mock_ps_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    return { checkoutUrl: `${successUrl}?reference=${ref}`, reference: ref };
  }
}

// -------------------------------------------------------------
// 2. FACTORY AND ROUTER LOGIC
// -------------------------------------------------------------
const providers = {
  paystack: new PaystackProvider(),
};

function getProvider(): IPaymentProvider {
  // Currently forcing Paystack for all scenarios
  return providers.paystack;
}

paymentsRouter.post(
  "/checkout",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { planId, billingCycle } = req.body;

      const user = db.findUserById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      const plan = availablePlans.find((p) => p.id === planId);
      if (!plan)
        return res.status(400).json({ success: false, error: "Invalid plan" });

      // Determine amount and currency
      const cycle = (billingCycle === "yearly" ? "yearly" : "monthly") as
        | "monthly"
        | "yearly";
      const currency = plan.currency;
      const amount = plan.prices[cycle] ?? plan.prices.monthly ?? 0;

      // Keep the amount in the currency the user actually pays in.
      // The app defaults to NGN, but the provider supports multiple currencies when configured.

      const provider = getProvider();

      // In production this would be the actual origin from headers
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const successUrl = `${baseUrl}/api/payments/verify`;
      const cancelUrl = `${baseUrl}/?payment=cancelled`;

      const { checkoutUrl, reference } = await provider.createCheckoutSession(
        userId,
        user.email,
        planId,
        billingCycle,
        amount,
        currency,
        successUrl,
        cancelUrl,
      );

      // Record pending transaction
      const transactionId = crypto.randomUUID();
      db.paymentTransactions.set(transactionId, {
        id: transactionId,
        userId,
        provider: provider.name,
        reference,
        planId,
        billingCycle,
        amount,
        currency,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json({ success: true, data: { checkoutUrl } });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: error.message || "Checkout initialization failed",
        });
    }
  },
);

paymentsRouter.get("/verify", async (req: Request, res: Response) => {
  try {
    const { reference } = req.query;
    if (!reference || typeof reference !== "string") {
      return res.redirect("/?payment=error");
    }

    // Find the transaction in DB
    let tx: DBPaymentTransaction | undefined;
    for (const t of db.paymentTransactions.values()) {
      if (t.reference === reference) {
        tx = t;
        break;
      }
    }

    if (!tx) {
      return res.redirect("/?payment=error_not_found");
    }

    if (tx.status === "successful") {
      return res.redirect("/?payment=success");
    }

    const provider = providers[tx.provider as keyof typeof providers];
    const isPaid = await provider.verifyPayment(reference);

    if (isPaid) {
      tx.status = "successful";
      tx.updatedAt = new Date().toISOString();

      // Upgrade user plan
      applySubscriptionUpgrade(tx);

      return res.redirect("/?payment=success");
    } else {
      tx.status = "failed";
      tx.updatedAt = new Date().toISOString();
      return res.redirect("/?payment=failed");
    }
  } catch (error) {
    console.error("Verify error:", error);
    res.redirect("/?payment=error");
  }
});

// Idempotent Webhook Handler
paymentsRouter.post(
  "/webhook/:provider",
  express.json({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const providerName = req.params.provider as keyof typeof providers;
    const provider = providers[providerName];

    if (!provider) return res.status(400).send("Unknown provider");

    try {
      const result = await provider.handleWebhook(req);

      if (result) {
        // 1. Idempotency Check: Have we processed this webhook event before?
        if (db.webhookEvents.has(result.eventId)) {
          console.log(`[Webhook] Duplicate event ignored: ${result.eventId}`);
          return res.status(200).send("Already processed");
        }

        // 2. Mark event as processed immediately
        db.webhookEvents.set(result.eventId, {
          eventId: result.eventId,
          provider: provider.name,
          eventType: result.type,
          processedAt: new Date().toISOString(),
        });

        // 3. Find associated transaction
        let tx: DBPaymentTransaction | undefined;
        for (const t of db.paymentTransactions.values()) {
          if (t.reference === result.reference) {
            tx = t;
            break;
          }
        }

        if (
          tx &&
          tx.status !== "successful" &&
          result.status === "successful"
        ) {
          tx.status = "successful";
          tx.updatedAt = new Date().toISOString();
          applySubscriptionUpgrade(tx);
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  },
);

function applySubscriptionUpgrade(tx: DBPaymentTransaction) {
  let billingInfo = db.billingRecords.get(tx.userId);

  if (!billingInfo) {
    billingInfo = {
      userId: tx.userId,
      planId: tx.planId,
      status: "active",
      billingCycle: tx.billingCycle as any,
      trialEndsAt: null,
      promotionalAccess: false,
      lifetimeAccess: false,
      partnerAccount: false,
      adminGrantedAccess: false,
      earlyAdopterAccess: false,
      earlyAccessActivatedAt: null,
      earlyAccessExpiresAt: null,
      auditLog: [],
      currency: tx.currency as any,
      currentAmount: tx.amount,
      paymentMethodLast4: "0000",
      nextBillingDate: new Date(
        Date.now() + (tx.billingCycle === "yearly" ? 365 : 30) * 86400000,
      )
        .toISOString()
        .split("T")[0],
      invoices: [],
    };
    db.billingRecords.set(tx.userId, billingInfo);
  } else {
    billingInfo.planId = tx.planId;
    billingInfo.billingCycle = tx.billingCycle as any;
    billingInfo.currentAmount = tx.amount;
    billingInfo.status = "active";
    billingInfo.currency = tx.currency as any;
    billingInfo.nextBillingDate = new Date(
      Date.now() + (tx.billingCycle === "yearly" ? 365 : 30) * 86400000,
    )
      .toISOString()
      .split("T")[0];
  }

  // Add audit log
  billingInfo.auditLog.push({
    date: new Date().toISOString(),
    action: "SUBSCRIPTION_UPGRADED",
    details: `Upgraded to ${tx.planId} (${tx.billingCycle}) via ${tx.provider}. Ref: ${tx.reference}`,
  });

  const user = db.findUserById(tx.userId);
  if (user) {
    user.planId = tx.planId as any;
  }
}
