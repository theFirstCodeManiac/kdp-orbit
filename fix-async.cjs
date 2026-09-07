const fs = require('fs');

function fix() {
  const auth = fs.readFileSync('server/auth.ts', 'utf8');
  fs.writeFileSync('server/auth.ts', auth
    .replace('export const authenticateToken = (', 'export const authenticateToken = async (')
    .replace('export const requireRole = (role: string) => {', 'export const requireRole = (role: string) => {') // Wait, requireRole returns a function
    .replace('return (req: Request, res: Response, next: NextFunction) => {', 'return async (req: Request, res: Response, next: NextFunction) => {')
  );

  const files = [
    'server/admin.ts', 'server/books.ts', 'server/competition.ts', 'server/dashboard.ts', 
    'server/niche.ts', 'server/payments.ts', 'server/saved.ts', 'server/subscriptions.ts', 'server/trends.ts'
  ];

  for (const f of files) {
    if(!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    // mostly Express handlers `router.get('/', (req, res) => {`
    // Convert them to async if they aren't.
    content = content.replace(/(router\.(get|post|put|delete)\([^,]+,\s*(?:\[[^\]]*\],\s*)?)(\(req, res\)|req, res|\(req, res, next\)|req, res, next) => {/g, '$1async $3 => {');
    
    // Also handle function declarations
    content = content.replace(/const (\w+) = \(req: Request, res: Response\) => {/g, 'const $1 = async (req: Request, res: Response) => {');
    
    fs.writeFileSync(f, content);
  }
}
fix();
