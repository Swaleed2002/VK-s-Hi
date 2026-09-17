import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: any;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  initialize: () => void;
  updatePresence: (isOnline: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  updatePresence: async (isOnline: boolean) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline,
        lastSeen: serverTimestamp()
      });
      set({ profile: { ...profile, isOnline } });
    } catch (e) {
      console.error('Failed to update presence', e);
    }
  },
  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });
    
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        set({ user: firebaseUser });
        // Fetch profile
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            set({ profile: docSnap.data() as UserProfile, loading: false });
            get().updatePresence(true);
          } else {
            // Profile not created yet (might happen during signup flow)
            set({ profile: null, loading: false });
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
          set({ profile: null, loading: false });
        }
      } else {
        const currentUser = get().user;
        if (currentUser) {
          // Best effort to set offline before removing user
          updateDoc(doc(db, 'users', currentUser.uid), {
            isOnline: false,
            lastSeen: serverTimestamp()
          }).catch(console.error);
        }
        set({ user: null, profile: null, loading: false });
      }
    });

    // Handle tab closing
    window.addEventListener('beforeunload', () => {
      const { user } = get();
      if (user) {
        updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastSeen: serverTimestamp()
        }).catch(console.error);
      }
    });
  }
}));
