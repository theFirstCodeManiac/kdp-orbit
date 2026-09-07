const fs = require('fs');

let content = fs.readFileSync('server/admin.ts', 'utf8');

// Fix the map with Promise.all
content = content.replace(
  /const users = Array\.from\(\(await db\.getAllUsers\(\)\)\)\.map\(u => \{/g,
  'const allUsers = await db.getAllUsers();\n  const users = await Promise.all(Array.from(allUsers).map(async (u) => {'
);
fs.writeFileSync('server/admin.ts', content);

// check books.ts
let books = fs.readFileSync('server/books.ts', 'utf8');
books = books.replace(/router\.get\('\/search', \(req, res\) => {/g, 'router.get(\'/search\', async (req, res) => {');
books = books.replace(/router\.get\('\/:id', \(req, res\) => {/g, 'router.get(\'/:id\', async (req, res) => {');
fs.writeFileSync('server/books.ts', books);

let niche = fs.readFileSync('server/niche.ts', 'utf8');
niche = niche.replace(/router\.get\('\/search', \(req, res\) => {/g, 'router.get(\'/search\', async (req, res) => {');
niche = niche.replace(/router\.get\('\/:id', \(req, res\) => {/g, 'router.get(\'/:id\', async (req, res) => {');
fs.writeFileSync('server/niche.ts', niche);

let comp = fs.readFileSync('server/competition.ts', 'utf8');
comp = comp.replace(/router\.get\('\/', \(req, res\) => {/g, 'router.get(\'/\', async (req, res) => {');
fs.writeFileSync('server/competition.ts', comp);

let trends = fs.readFileSync('server/trends.ts', 'utf8');
trends = trends.replace(/router\.get\('\/', \(req, res\) => {/g, 'router.get(\'/\', async (req, res) => {');
fs.writeFileSync('server/trends.ts', trends);

let payments = fs.readFileSync('server/payments.ts', 'utf8');
payments = payments.replace(/router\.post\('\/create-session', authenticateToken, \(req, res\) => {/g, 'router.post(\'/create-session\', authenticateToken, async (req, res) => {');
payments = payments.replace(/router\.get\('\/verify', authenticateToken, \(req, res\) => {/g, 'router.get(\'/verify\', authenticateToken, async (req, res) => {');
payments = payments.replace(/router\.post\('\/webhook', express\.raw\(\{type: 'application\/json'\}\), \(req, res\) => {/g, 'router.post(\'/webhook\', express.raw({type: \'application/json\'}), async (req, res) => {');
fs.writeFileSync('server/payments.ts', payments);

let saved = fs.readFileSync('server/saved.ts', 'utf8');
saved = saved.replace(/router\.get\('\/collections', authenticateToken, \(req, res\) => {/g, 'router.get(\'/collections\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.post\('\/collections', authenticateToken, \(req, res\) => {/g, 'router.post(\'/collections\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.get\('\/items', authenticateToken, \(req, res\) => {/g, 'router.get(\'/items\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.post\('\/items', authenticateToken, \(req, res\) => {/g, 'router.post(\'/items\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.delete\('\/collections\/:id', authenticateToken, \(req, res\) => {/g, 'router.delete(\'/collections/:id\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.delete\('\/items\/:id', authenticateToken, \(req, res\) => {/g, 'router.delete(\'/items/:id\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.get\('\/covers', authenticateToken, \(req, res\) => {/g, 'router.get(\'/covers\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.post\('\/covers', authenticateToken, \(req, res\) => {/g, 'router.post(\'/covers\', authenticateToken, async (req, res) => {');
saved = saved.replace(/router\.delete\('\/covers\/:id', authenticateToken, \(req, res\) => {/g, 'router.delete(\'/covers/:id\', authenticateToken, async (req, res) => {');
fs.writeFileSync('server/saved.ts', saved);

let sub = fs.readFileSync('server/subscriptions.ts', 'utf8');
sub = sub.replace(/router\.get\('\/status', authenticateToken, \(req, res\) => {/g, 'router.get(\'/status\', authenticateToken, async (req, res) => {');
sub = sub.replace(/router\.post\('\/cancel', authenticateToken, \(req, res\) => {/g, 'router.post(\'/cancel\', authenticateToken, async (req, res) => {');
fs.writeFileSync('server/subscriptions.ts', sub);

