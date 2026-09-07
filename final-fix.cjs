const fs = require('fs');

const files = [
  'server/auth.ts', 'server/dashboard.ts', 'server/payments.ts', 'server/saved.ts',
  'server/admin.ts', 'server/books.ts', 'server/niche.ts', 'server/subscriptions.ts',
  'server/trends.ts', 'server/competition.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');

  // Fix middleware & handlers to be async
  // Look for `(req: Request, res: Response, next: NextFunction) => {`
  text = text.replace(/\(req(: [^,]+)?, res(: [^,]+)?, next(: [^)]+)?\) => \{/g, 'async (req$1, res$2, next$3) => {');
  // Look for `(req: Request, res: Response) => {`
  text = text.replace(/\(req(: [^,]+)?, res(: [^)]+)?\) => \{/g, 'async (req$1, res$2) => {');
  
  // Clean up any double async
  text = text.replace(/async\s+async/g, 'async');

  // One specific error in admin.ts
  text = text.replace(/db\.findUserById\(billing\.userId\)\?\.email/g, '(await db.findUserById(billing.userId))?.email');

  fs.writeFileSync(file, text);
}
