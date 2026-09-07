const fs = require('fs');

let admin = fs.readFileSync('server/admin.ts', 'utf8');
admin = admin.replace(/\}\);\n  \n  res\.json/g, '  }));\n  \n  res.json');
admin = admin.replace(/adminRouter\.(get|post|put|delete)\('([^']+)', requireAdmin, \(req: AuthenticatedRequest, res: Response\) => \{/g, 'adminRouter.$1(\'$2\', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {');
admin = admin.replace(/adminRouter\.(get|post|put|delete)\('([^']+)', \(req: AuthenticatedRequest, res: Response\) => \{/g, 'adminRouter.$1(\'$2\', async (req: AuthenticatedRequest, res: Response) => {');
fs.writeFileSync('server/admin.ts', admin);

let dash = fs.readFileSync('server/dashboard.ts', 'utf8');
dash = dash.replace(/dashboardRouter\.get\('\/metrics', authenticateToken, \(req, res\) => \{/g, 'dashboardRouter.get(\'/metrics\', authenticateToken, async (req, res) => {');
dash = dash.replace(/dashboardRouter\.get\('\/metrics', authenticateToken, \(req: AuthenticatedRequest, res: Response\) => \{/g, 'dashboardRouter.get(\'/metrics\', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {');
fs.writeFileSync('server/dashboard.ts', dash);
