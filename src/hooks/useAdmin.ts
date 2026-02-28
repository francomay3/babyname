import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BabyName, UserScore, AdminConfig } from '../types';
import { useAuth } from './useAuth';

const SEED_ADMIN_UID = 'tnA7CzcA6RW3lrdmEjE0ntCSZ3M2';

interface RawUserInfo {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface UserWithStats {
  uid: string;
  displayName: string;
  photoURL: string;
  namesAdded: BabyName[];
  matchCount: number;
  scores: UserScore[];
}

export function useAdmin() {
  const { user } = useAuth();
  const [adminUids, setAdminUids] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [rawUsers, setRawUsers] = useState<RawUserInfo[]>([]);
  const [rawNames, setRawNames] = useState<BabyName[]>([]);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [rawScores, setRawScores] = useState<UserScore[]>([]);

  // Subscribe to /config/admins — determines isAdmin, bootstraps if needed
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'admins'), (snap) => {
      if (snap.exists()) {
        const uids = (snap.data() as AdminConfig).uids ?? [];
        setAdminUids(uids);
        setIsAdmin(!!user && uids.includes(user.uid));
      } else {
        setAdminUids([]);
        if (user?.uid === SEED_ADMIN_UID) {
          // Bootstrap: create the doc — Firestore rule allows write when doc doesn't exist
          void setDoc(doc(db, 'config', 'admins'), { uids: [SEED_ADMIN_UID] });
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    });
    return unsub;
  }, [user]);

  // Load full data for admin stats — only when this instance is used as admin
  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setRawUsers(snap.docs.map((d) => d.data() as RawUserInfo));
    });

    const unsubNames = onSnapshot(collection(db, 'names'), (snap) => {
      setRawNames(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BabyName, 'id' | 'addedAt'>),
          addedAt: d.data().addedAt?.toDate() ?? new Date(),
        }))
      );
    });

    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const userId = d.data().userId as string;
        counts[userId] = (counts[userId] ?? 0) + 1;
      });
      setMatchCounts(counts);
    });

    const unsubScores = onSnapshot(collection(db, 'userScores'), (snap) => {
      setRawScores(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserScore, 'id'>),
        }))
      );
    });

    return () => {
      unsubUsers();
      unsubNames();
      unsubMatches();
      unsubScores();
    };
  }, [isAdmin]);

  const allUsersWithStats = useMemo<UserWithStats[]>(
    () =>
      rawUsers.map((u) => ({
        uid: u.uid,
        displayName: u.displayName,
        photoURL: u.photoURL,
        namesAdded: rawNames.filter((n) => n.addedBy === u.uid),
        matchCount: matchCounts[u.uid] ?? 0,
        scores: rawScores.filter((s) => s.userId === u.uid),
      })),
    [rawUsers, rawNames, matchCounts, rawScores]
  );

  const resetUserVotes = useCallback(async (userId: string) => {
    const [matchesSnap, scoresSnap] = await Promise.all([
      getDocs(query(collection(db, 'matches'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'userScores'), where('userId', '==', userId))),
    ]);

    const allDocs = [...matchesSnap.docs, ...scoresSnap.docs];
    for (let i = 0; i < allDocs.length; i += 500) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }, []);

  const deleteUser = useCallback(
    async (userId: string) => {
      await resetUserVotes(userId);
      const namesSnap = await getDocs(
        query(collection(db, 'names'), where('addedBy', '==', userId))
      );
      const batch = writeBatch(db);
      namesSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, 'users', userId));
      await batch.commit();
    },
    [resetUserVotes]
  );

  const resetDatabase = useCallback(async () => {
    const [namesSnap, scoresSnap, matchesSnap] = await Promise.all([
      getDocs(collection(db, 'names')),
      getDocs(collection(db, 'userScores')),
      getDocs(collection(db, 'matches')),
    ]);

    const allDocs = [...namesSnap.docs, ...scoresSnap.docs, ...matchesSnap.docs];
    for (let i = 0; i < allDocs.length; i += 500) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }, []);

  const addAdmin = useCallback(async (uid: string) => {
    await updateDoc(doc(db, 'config', 'admins'), { uids: arrayUnion(uid) });
  }, []);

  const removeAdmin = useCallback(async (uid: string) => {
    await updateDoc(doc(db, 'config', 'admins'), { uids: arrayRemove(uid) });
  }, []);

  const savePhases = useCallback(async (date1: Date, date2: Date) => {
    await setDoc(doc(db, 'config', 'phases'), { date1, date2 });
  }, []);

  return {
    isAdmin,
    adminUids,
    allUsersWithStats,
    resetUserVotes,
    deleteUser,
    resetDatabase,
    addAdmin,
    removeAdmin,
    savePhases,
  };
}
