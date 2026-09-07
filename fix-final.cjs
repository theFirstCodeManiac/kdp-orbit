const fs = require('fs');

let admin = fs.readFileSync('server/admin.ts', 'utf8');
admin = admin.replace(/billing\.auditLog\.forEach\(log => \{/g, 'for (const log of billing.auditLog) {');
admin = admin.replace(/\}\);\n    \}/g, '}\n    }');
fs.writeFileSync('server/admin.ts', admin);

let payments = fs.readFileSync('server/payments.ts', 'utf8');
payments = payments.replace(/function applySubscriptionUpgrade\(/g, 'async function applySubscriptionUpgrade(');
payments = payments.replace(/function updateSubscription\(/g, 'async function updateSubscription('); // just in case
// also wait, are there usages of applySubscriptionUpgrade?
payments = payments.replace(/applySubscriptionUpgrade\(tx\);/g, 'await applySubscriptionUpgrade(tx);');
fs.writeFileSync('server/payments.ts', payments);

let subs = fs.readFileSync('server/subscriptions.ts', 'utf8');
subs = subs.replace(/export function resolveUserEntitlements\(/g, 'export async function resolveUserEntitlements(');
fs.writeFileSync('server/subscriptions.ts', subs);

// Wait, if resolveUserEntitlements is now async, we need to await it where it's called!
let auth = fs.readFileSync('server/auth.ts', 'utf8');
auth = auth.replace(/const entitlements = resolveUserEntitlements/g, 'const entitlements = await resolveUserEntitlements');
fs.writeFileSync('server/auth.ts', auth);

let dash = fs.readFileSync('server/dashboard.ts', 'utf8');
dash = dash.replace(/const entitlements = resolveUserEntitlements/g, 'const entitlements = await resolveUserEntitlements');
fs.writeFileSync('server/dashboard.ts', dash);
