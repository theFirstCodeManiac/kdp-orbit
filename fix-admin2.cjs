const fs = require('fs');
let admin = fs.readFileSync('server/admin.ts', 'utf8');
admin = admin.replace(/for \(const billing of \(await db\.getAllBillingRecords\(\) \{/g, 'for (const billing of (await db.getAllBillingRecords())) {');
fs.writeFileSync('server/admin.ts', admin);
