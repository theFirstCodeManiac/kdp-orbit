const fs = require('fs');

let content = fs.readFileSync('server/db.ts', 'utf8');

// Replace the initialization block
const oldInit = `// Initialize Firebase Admin (ADC is automatically provided by AI Studio)
const app = initializeApp({ credential: applicationDefault() });
const firestore = getFirestore(app);`;

const newInit = `import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin (ADC is automatically provided by AI Studio)
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let projectId = 'prefab-rarity-dxfhk';
let databaseId = 'ai-studio-kdporbit-4855dcc2-134b-4bc7-b381-037a0a3c4b4f';

try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.projectId) projectId = config.projectId;
    if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.warn('Could not read firebase config', e);
}

const app = initializeApp({ 
  projectId,
  credential: applicationDefault() 
});
const firestore = getFirestore(app, databaseId);`;

if (content.includes(oldInit)) {
  content = content.replace(oldInit, newInit);
  fs.writeFileSync('server/db.ts', content);
  console.log("Fixed db.ts");
} else {
  console.log("Could not find old init in db.ts");
}
