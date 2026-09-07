const fs = require('fs');

const files = [
  'server/auth.ts', 'server/dashboard.ts', 'server/payments.ts', 'server/saved.ts',
  'server/admin.ts', 'server/books.ts', 'server/niche.ts', 'server/subscriptions.ts',
  'server/trends.ts', 'server/competition.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');

  // Any router method
  text = text.replace(/Router\.(get|post|put|delete)\([^;]+?\)(?=\s*;|\n)/g, (match) => {
    return match.replace(/\(req(:[^,]+)?, res(:[^,]+)?\) => \{/g, 'async (req$1, res$2) => {')
                .replace(/\(req(:[^,]+)?, res(:[^,]+)?, next(:[^)]+)?\) => \{/g, 'async (req$1, res$2, next$3) => {');
  });

  // some might not match the ; end
  text = text.replace(/,\s*\(req([^\)]*)\)\s*=>\s*\{/g, ', async (req$1) => {');

  // clean up extra async
  text = text.replace(/async\s+async/g, 'async');

  fs.writeFileSync(file, text);
}
