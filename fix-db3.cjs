const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf8');

const replacement = `let app;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      app = getApp();
    }
    
    // Check if the service account matches the AI studio project
    const isAiStudioProject = serviceAccount.project_id === 'prefab-rarity-dxfhk';
    firestoreInstance = getFirestore(app, isAiStudioProject ? databaseId : undefined);`;

content = content.replace(/let app;\s*if \(getApps\(\)\.length === 0\) \{[\s\S]*?firestoreInstance = getFirestore\(app, databaseId\);/, replacement);
fs.writeFileSync('server/db.ts', content);
