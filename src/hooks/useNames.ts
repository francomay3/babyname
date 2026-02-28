import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BabyName, Gender } from '../types';
import { useAuth } from './useAuth';
import { recalculateUserElo } from '../lib/recalculateElo';

export function useNames(gender?: Gender) {
  const { user } = useAuth();
  const [names, setNames] = useState<BabyName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = gender
      ? [where('gender', '==', gender), orderBy('addedAt', 'asc')]
      : [orderBy('addedAt', 'asc')];

    const q = query(collection(db, 'names'), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      setNames(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BabyName, 'id' | 'addedAt'>),
          addedAt: doc.data().addedAt?.toDate() ?? new Date(),
        }))
      );
      setLoading(false);
    });

    return unsub;
  }, [gender]);

  async function addName(text: string, gender: Gender) {
    if (!user) return;
    await addDoc(collection(db, 'names'), {
      text: text.trim(),
      gender,
      addedBy: user.uid,
      addedAt: serverTimestamp(),
    });
  }

  async function deleteName(nameId: string) {
    const [scoresSnap, winnerSnap, loserSnap] = await Promise.all([
      getDocs(query(collection(db, 'userScores'), where('nameId', '==', nameId))),
      getDocs(query(collection(db, 'matches'), where('winnerId', '==', nameId))),
      getDocs(query(collection(db, 'matches'), where('loserId', '==', nameId))),
    ]);

    const affectedUserIds = new Set<string>();
    [...winnerSnap.docs, ...loserSnap.docs].forEach((d) => {
      affectedUserIds.add(d.data().userId as string);
    });

    const allDocs = [...scoresSnap.docs, ...winnerSnap.docs, ...loserSnap.docs];
    for (let i = 0; i < allDocs.length; i += 500) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'names', nameId));

    await Promise.all([...affectedUserIds].map(recalculateUserElo));
  }

  return { names, loading, addName, deleteName };
}
