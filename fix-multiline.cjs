const fs = require('fs');

const files = [
  'server/auth.ts', 'server/dashboard.ts', 'server/payments.ts', 'server/saved.ts',
  'server/admin.ts', 'server/books.ts', 'server/niche.ts', 'server/subscriptions.ts',
  'server/trends.ts', 'server/competition.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');

  // Match multiline arrow functions
  text = text.replace(/=\s*\(\s*req:\s*(?:Authenticated)?Request,\s*res:\s*Response(?:,\s*next:\s*NextFunction)?\s*\)\s*=>/g, '= async (req: any, res: any, next: any) =>');
  
  // also for function declarations if any
  text = text.replace(/function\s*\(\s*req:\s*(?:Authenticated)?Request,\s*res:\s*Response(?:,\s*next:\s*NextFunction)?\s*\)/g, 'async function(req: any, res: any, next: any)');

  // clean up extra async
  text = text.replace(/async\s+async/g, 'async');

  // specific fixes for admin.ts
  text = text.replace(/await db\.getAllBillingRecords\(\)\)/g, 'await db.getAllBillingRecords()');
  
  // subscriptions.ts line 29
  text = text.replace(/const status = \(req: AuthenticatedRequest, res: Response\) => \{/g, 'const status = async (req: any, res: any) => {');

  // payments.ts function definitions
  text = text.replace(/const processStripeWebhook = \(req: Request, res: Response\) => \{/g, 'const processStripeWebhook = async (req: any, res: any) => {');
  text = text.replace(/const processPaystackWebhook = \(req: Request, res: Response\) => \{/g, 'const processPaystackWebhook = async (req: any, res: any) => {');
  text = text.replace(/const updateSubscription = \(tx: DBPaymentTransaction\) => \{/g, 'const updateSubscription = async (tx: any) => {');

  fs.writeFileSync(file, text);
}
