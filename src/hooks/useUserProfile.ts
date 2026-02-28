import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Match, UserScore } from '../types';

export function useUserProfile(targetUserId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let matchesLoaded = false;
    let scoresLoaded = false;

    const checkDone = () => {
      if (matchesLoaded && scoresLoaded) setLoading(false);
    };

    const unsubMatches = onSnapshot(
      query(collection(db, 'matches'), where('userId', '==', targetUserId)),
      (snap) => {
        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Match, 'id' | 'createdAt'>),
            createdAt: d.data().createdAt?.toDate() ?? new Date(),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMatches(docs);
        matchesLoaded = true;
        checkDone();
      }
    );

    const unsubScores = onSnapshot(
      query(collection(db, 'userScores'), where('userId', '==', targetUserId)),
      (snap) => {
        setScores(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<UserScore, 'id'>),
          }))
        );
        scoresLoaded = true;
        checkDone();
      }
    );

    return () => {
      unsubMatches();
      unsubScores();
    };
  }, [targetUserId]);

  const resetVotes = useCallback(async () => {
    const [matchesSnap, scoresSnap] = await Promise.all([
      getDocs(query(collection(db, 'matches'), where('userId', '==', targetUserId))),
      getDocs(query(collection(db, 'userScores'), where('userId', '==', targetUserId))),
    ]);
    const allDocs = [...matchesSnap.docs, ...scoresSnap.docs];
    for (let i = 0; i < allDocs.length; i += 500) {
      const batch = writeBatch(db);
      allDocs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }, [targetUserId]);

  const deleteMatch = useCallback(async (match: Match) => {
    const winnerScoreId = `${match.userId}_${match.winnerId}`;
    const loserScoreId = `${match.userId}_${match.loserId}`;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'matches', match.id));
    batch.update(doc(db, 'userScores', winnerScoreId), { wins: increment(-1), matches: increment(-1) });
    batch.update(doc(db, 'userScores', loserScoreId), { losses: increment(-1), matches: increment(-1) });
    await batch.commit();
  }, []);

  return { matches, scores, loading, resetVotes, deleteMatch };
}
