const fs = require('fs');

let content = fs.readFileSync('server/db.ts', 'utf8');

const oldBlock = `// Initialize Firebase Admin (ADC is automatically provided by AI Studio)
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

const newBlock = `import { cert, getApps, getApp } from 'firebase-admin/app';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let databaseId = 'ai-studio-kdporbit-4855dcc2-134b-4bc7-b381-037a0a3c4b4f';

try {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.warn('Could not read firebase config', e);
}

let firestoreInstance = null;
function getDb() {
  if (!firestoreInstance) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required for backend Firestore access. Please generate a new private key from Firebase Console -> Project Settings -> Service Accounts, and paste the JSON string in the AI Studio Settings.");
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON string.");
    }

    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      app = getApp();
    }
    firestoreInstance = getFirestore(app, databaseId);
  }
  return firestoreInstance;
}`;

content = content.replace(oldBlock, newBlock);
content = content.replace(/firestore\./g, 'getDb().');
// Wait, I need to make sure I don't replace `import { getFirestore } from 'firebase-admin/firestore';`
// The regex above will replace it? No, it's `getFirestore` not `firestore.`.

fs.writeFileSync('server/db.ts', content);

// Also we need to add it to .env.example
let env = fs.readFileSync('.env.example', 'utf8');
if (!env.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
  env += '\nFIREBASE_SERVICE_ACCOUNT_KEY=\n';
  fs.writeFileSync('.env.example', env);
}

