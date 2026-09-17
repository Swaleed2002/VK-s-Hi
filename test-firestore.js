import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDoc(doc(db, 'usernames', 'testuser123'));
    console.log("Read successful! Exists:", snap.exists());
    process.exit(0);
  } catch (err) {
    console.error("Firestore test failed:", err.message);
    process.exit(1);
  }
}
test();
