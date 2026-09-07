const fs = require('fs');
const files = fs.readdirSync('server').filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync('server/' + file, 'utf8');

  // Any router method handler that is not async
  content = content.replace(/([a-zA-Z0-9_]+Router\.(get|post|put|delete)\([^,]+(?:,\s*[a-zA-Z0-9_]+)*,\s*)\(req(: [^,]+)?, res(: [^)]+)?\) => \{/g, '$1async (req$3, res$4) => {');
  
  // also fix Promise<void>
  content = content.replace(/\): void \{/g, '): Promise<void> {');
  // for requireAuth specifically
  content = content.replace(/export async function requireAuth\([\s\S]+?\):\s*void\s*\{/g, str => str.replace('void', 'Promise<void>'));
  content = content.replace(/export async function requireAdmin\([\s\S]+?\):\s*void\s*\{/g, str => str.replace('void', 'Promise<void>'));

  fs.writeFileSync('server/' + file, content);
}
