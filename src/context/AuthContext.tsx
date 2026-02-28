import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface UserInfo {
  uid: string;
  displayName: string;
  photoURL: string;
}

interface AuthContextValue {
  user: User | null;
  allUsers: UserInfo[];
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  allUsers: [],
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? 'Anónimo',
            photoURL: firebaseUser.photoURL ?? '',
            lastSeen: new Date(),
          },
          { merge: true }
        );
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Keep a live list of all registered users (for combined ranking labels)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(
        snap.docs.map((d) => d.data() as UserInfo)
      );
    });
    return unsub;
  }, []);

  async function signIn() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logOut() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, allUsers, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}
