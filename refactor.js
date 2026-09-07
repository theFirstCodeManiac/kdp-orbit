const fs = require('fs');
const glob = require('glob'); // Need to install or just use fs.readdirSync

function refactorFiles() {
  const files = [
    'server/auth.ts',
    'server/dashboard.ts',
    'server/payments.ts',
    'server/saved.ts',
    'server/admin.ts',
    'server/books.ts',
    'server/niche.ts',
    'server/subscriptions.ts',
    'server/trends.ts',
    'server/competition.ts',
  ];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Make findUserById / findUserByEmail async
    content = content.replace(/const (\w+) = db\.findUserById\((.+?)\);/g, 'const $1 = await db.findUserById($2);');
    content = content.replace(/let (\w+) = db\.findUserById\((.+?)\);/g, 'let $1 = await db.findUserById($2);');
    content = content.replace(/user = db\.findUserById\((.+?)\);/g, 'user = await db.findUserById($1);');
    
    content = content.replace(/const (\w+) = db\.findUserByEmail\((.+?)\);/g, 'const $1 = await db.findUserByEmail($2);');
    content = content.replace(/let (\w+) = db\.findUserByEmail\((.+?)\);/g, 'let $1 = await db.findUserByEmail($2);');
    content = content.replace(/user = db\.findUserByEmail\((.+?)\);/g, 'user = await db.findUserByEmail($1);');

    // db.users.set -> await db.setUser
    content = content.replace(/db\.users\.set\(([^,]+),\s*([^)]+)\);/g, 'await db.setUser($2);');
    // db.users.size -> await db.getUserCount()
    content = content.replace(/db\.users\.size/g, '(await db.getUserCount())');
    // db.users.values() -> await db.getAllUsers()
    content = content.replace(/db\.users\.values\(\)/g, '(await db.getAllUsers())');

    // db.sessions
    content = content.replace(/db\.sessions\.get\((.+?)\)/g, 'await db.getSession($1)');
    content = content.replace(/db\.sessions\.set\([^,]+,\s*([^)]+)\)/g, 'await db.setSession($1)');
    content = content.replace(/db\.sessions\.delete\((.+?)\)/g, 'await db.deleteSession($1)');
    content = content.replace(/db\.sessions\.values\(\)/g, '(await db.getAllSessions())');

    // usageRecords
    content = content.replace(/db\.usageRecords\.get\((.+?)\)/g, 'await db.getUsageRecord($1)');
    content = content.replace(/db\.usageRecords\.set\(([^,]+),\s*([^)]+)\)/g, 'await db.setUsageRecord($1, $2)');
    content = content.replace(/db\.usageRecords\.delete\((.+?)\)/g, 'await db.deleteUsageRecord($1)');
    content = content.replace(/db\.usageRecords\.values\(\)/g, '(await db.getAllUsageRecords())');

    // billingRecords
    content = content.replace(/db\.billingRecords\.get\((.+?)\)/g, 'await db.getBillingRecord($1)');
    content = content.replace(/db\.billingRecords\.set\(([^,]+),\s*([^)]+)\)/g, 'await db.setBillingRecord($1, $2)');
    content = content.replace(/db\.billingRecords\.values\(\)/g, '(await db.getAllBillingRecords())');

    // recentSearches
    content = content.replace(/db\.recentSearches\.set\(([^,]+),\s*([^)]+)\)/g, 'await db.setRecentSearch($1, $2)');
    content = content.replace(/db\.recentSearches\.values\(\)/g, '(await db.getAllRecentSearches())');

    // researchItems
    content = content.replace(/db\.researchItems\.values\(\)/g, '(await db.getAllResearchItems())');
    
    // coverProjects
    content = content.replace(/db\.coverProjects\.values\(\)/g, '(await db.getAllCoverProjects())');

    // webhookEvents
    content = content.replace(/db\.webhookEvents\.has\((.+?)\)/g, 'await db.hasWebhookEvent($1)');
    content = content.replace(/db\.webhookEvents\.set\(([^,]+),\s*([^)]+)\)/g, 'await db.setWebhookEvent($1, $2)');

    // paymentTransactions
    content = content.replace(/db\.paymentTransactions\.set\(([^,]+),\s*([^)]+)\)/g, 'await db.setPaymentTransaction($1, $2)');
    content = content.replace(/db\.paymentTransactions\.values\(\)/g, '(await db.getAllPaymentTransactions())');

    // collections
    content = content.replace(/db\.collections\.get\((.+?)\)/g, 'await db.getCollection($1)');

    // savedItems
    content = content.replace(/db\.savedItems\.values\(\)/g, '(await db.getAllSavedItems())');
    content = content.replace(/db\.savedItems\.get\((.+?)\)/g, 'await db.getSavedItem($1)');

    // db methods
    content = content.replace(/db\.getCollections\((.+?)\)/g, 'await db.getCollections($1)');
    content = content.replace(/db\.createCollection\((.+?)\)/g, 'await db.createCollection($1)');
    content = content.replace(/db\.getSavedItems\((.+?)\)/g, 'await db.getSavedItems($1)');
    content = content.replace(/db\.saveItem\((.+?)\)/g, 'await db.saveItem($1)');
    content = content.replace(/db\.deleteCollection\((.+?)\)/g, 'await db.deleteCollection($1)');
    content = content.replace(/db\.deleteSavedItem\((.+?)\)/g, 'await db.deleteSavedItem($1)');
    
    content = content.replace(/db\.getCoverProjects\((.+?)\)/g, 'await db.getCoverProjects($1)');
    content = content.replace(/db\.saveCoverProject\((.+?)\)/g, 'await db.saveCoverProject($1)');
    content = content.replace(/db\.deleteCoverProject\((.+?)\)/g, 'await db.deleteCoverProject($1)');

    content = content.replace(/db\.searchBooks\((.+?)\)/g, 'await db.searchBooks($1)');
    content = content.replace(/db\.searchNiches\((.+?)\)/g, 'await db.searchNiches($1)');
    content = content.replace(/db\.analyzeCompetition\((.+?)\)/g, 'await db.analyzeCompetition($1)');
    content = content.replace(/db\.getTrends\(\)/g, 'await db.getTrends()');
    content = content.replace(/db\.deleteUserCascade\((.+?)\)/g, 'await db.deleteUserCascade($1)');
    content = content.replace(/db\.sanitizeUser\((.+?)\)/g, 'db.sanitizeUser($1)'); // keep sync

    fs.writeFileSync(file, content);
  }
}

refactorFiles();
