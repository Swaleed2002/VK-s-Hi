import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "gen-lang-client-0069655450",
  appId: "1:720452739533:web:c361f02a7fb11ca0026484",
  apiKey: "AIzaSyACfL7At9TSCbItYfO4dtLklAkev5lHXPE",
  authDomain: "gen-lang-client-0069655450.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-2fa678fc-02ab-44fc-80a5-2113c977be53",
  storageBucket: "gen-lang-client-0069655450.firebasestorage.app",
  messagingSenderId: "720452739533",
  measurementId: "",
  oAuthClientId: "720452739533-br4mhhl3i4ni9hr33ihi1iau3jo8jml5.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
