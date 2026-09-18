import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// We fetch it from the dynamically injected json from AI Studio environment
const firebaseConfig = {
  // This gets populated dynamically in AI Studio. 
  // We can import it if we know the path, but standard AI Studio injects `firebase-applet-config.json` in the root.
};

// We will fetch the config json and initialize later in main.tsx or App.tsx, but since we can use import in vite:
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, config.firestoreDatabaseId);
export const storage = getStorage(app);
