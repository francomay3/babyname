import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Gender, RankedName, UserScore, BabyName } from '../types';
import { useAuth } from './useAuth';

interface UserInfo {
  uid: string;
  displayName: string;
}

export function useRanking(gender: Gender) {
  const { user, allUsers } = useAuth();
  const [names, setNames] = useState<BabyName[]>([]);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to all names for this gender
  useEffect(() => {
    const q = query(collection(db, 'names'), where('gender', '==', gender));
    const unsub = onSnapshot(q, (snap) => {
      setNames(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<BabyName, 'id' | 'addedAt'>),
          addedAt: doc.data().addedAt?.toDate() ?? new Date(),
        }))
      );
    });
    return unsub;
  }, [gender]);

  // Listen to all userScores for this gender
  useEffect(() => {
    const q = query(
      collection(db, 'userScores'),
      where('gender', '==', gender)
    );
    const unsub = onSnapshot(q, (snap) => {
      setScores(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserScore, 'id'>),
        }))
      );
      setLoading(false);
    });
    return unsub;
  }, [gender]);

  function buildRanking(targetUserId?: string): RankedName[] {
    return names
      .map((name) => {
        const nameScores = scores.filter((s) => s.nameId === name.id);

        if (targetUserId) {
          // Personal ranking
          const myScore = nameScores.find((s) => s.userId === targetUserId);
          return {
            ...name,
            eloScore: myScore?.eloScore ?? 1000,
            wins: myScore?.wins ?? 0,
            losses: myScore?.losses ?? 0,
            matches: myScore?.matches ?? 0,
          };
        } else {
          // Combined ranking: average of all users' scores
          const voters = nameScores.filter((s) => s.matches > 0);
          const avgElo =
            voters.length > 0
              ? Math.round(
                  voters.reduce((sum, s) => sum + s.eloScore, 0) / voters.length
                )
              : 1000;

          const allScoresDetail = (allUsers as UserInfo[])
            .map((u) => {
              const s = nameScores.find((ns) => ns.userId === u.uid);
              return s
                ? {
                    userId: u.uid,
                    displayName: u.displayName,
                    eloScore: s.eloScore,
                  }
                : null;
            })
            .filter(Boolean) as { userId: string; displayName: string; eloScore: number }[];

          return {
            ...name,
            eloScore: avgElo,
            wins: nameScores.reduce((sum, s) => sum + s.wins, 0),
            losses: nameScores.reduce((sum, s) => sum + s.losses, 0),
            matches: nameScores.reduce((sum, s) => sum + s.matches, 0),
            allScores: allScoresDetail,
          };
        }
      })
      .sort((a, b) => b.eloScore - a.eloScore);
  }

  return {
    myRanking: buildRanking(user?.uid),
    combinedRanking: buildRanking(),
    loading,
  };
}
