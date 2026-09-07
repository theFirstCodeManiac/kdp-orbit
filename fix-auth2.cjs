const fs = require('fs');
let auth = fs.readFileSync('server/auth.ts', 'utf8');
auth = auth.replace(/if \(db\.findUserByEmail\(email\)\) \{/g, 'if (await db.findUserByEmail(email)) {');
fs.writeFileSync('server/auth.ts', auth);
