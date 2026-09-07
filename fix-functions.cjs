const fs = require('fs');

const files = [
  'server/auth.ts', 'server/dashboard.ts', 'server/payments.ts', 'server/saved.ts',
  'server/admin.ts', 'server/books.ts', 'server/niche.ts', 'server/subscriptions.ts',
  'server/trends.ts', 'server/competition.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');

  text = text.replace(/export function authenticateToken\(/g, 'export async function authenticateToken(');
  text = text.replace(/export function requireRole\(/g, 'export function requireRole(');
  // Wait, requireRole returns a function:
  text = text.replace(/return function\(req/g, 'return async function(req');
  
  // also fix void to Promise<void> for these async middleware if needed, but TS might allow it
  
  // Let's just fix any function that has await in it
  text = text.replace(/function updateSubscription\(/g, 'async function updateSubscription(');
  text = text.replace(/function processStripeWebhook\(/g, 'async function processStripeWebhook(');
  text = text.replace(/function processPaystackWebhook\(/g, 'async function processPaystackWebhook(');
  text = text.replace(/export function requirePlan\(/g, 'export function requirePlan(');
  text = text.replace(/return \(req:/g, 'return async (req:');

  fs.writeFileSync(file, text);
}
