import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserStatsSummary {
  namesCount: number;
  votesCount: number;
}

export function useUserStatsSummary() {
  const [nameCounts, setNameCounts] = useState<Record<string, number>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'names'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach((doc) => {
        const data = doc.data() as { addedBy?: string };
        if (!data.addedBy) return;
        counts[data.addedBy] = (counts[data.addedBy] ?? 0) + 1;
      });
      setNameCounts(counts);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'matches'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach((doc) => {
        const userId = doc.data().userId as string | undefined;
        if (!userId) return;
        counts[userId] = (counts[userId] ?? 0) + 1;
      });
      setVoteCounts(counts);
    });
    return unsubscribe;
  }, []);

  const statsByUserId = useMemo(() => {
    const result: Record<string, UserStatsSummary> = {};

    Object.entries(nameCounts).forEach(([uid, count]) => {
      if (!result[uid]) result[uid] = { namesCount: 0, votesCount: 0 };
      result[uid].namesCount = count;
    });

    Object.entries(voteCounts).forEach(([uid, count]) => {
      if (!result[uid]) result[uid] = { namesCount: 0, votesCount: 0 };
      result[uid].votesCount = count;
    });

    return result;
  }, [nameCounts, voteCounts]);

  return { statsByUserId };
}
