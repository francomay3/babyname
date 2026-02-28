import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BabyName, Gender } from '../types';
import { useAuth } from './useAuth';

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

  return { names, loading, addName };
}
