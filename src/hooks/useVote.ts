import { useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { BabyName, Gender, UserScore } from '../types';
import { newRatings } from '../lib/elo';
import { useAuth } from './useAuth';

const DEFAULT_ELO = 1000;

export function useVote() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function getOrCreateScore(
    userId: string,
    nameId: string,
    gender: Gender
  ): Promise<UserScore> {
    const scoreId = `${userId}_${nameId}`;
    const ref = doc(db, 'userScores', scoreId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return { id: scoreId, ...(snap.data() as Omit<UserScore, 'id'>) };
    }

    const fresh: Omit<UserScore, 'id'> = {
      userId,
      nameId,
      gender,
      eloScore: DEFAULT_ELO,
      wins: 0,
      losses: 0,
      matches: 0,
    };
    await setDoc(ref, fresh);
    return { id: scoreId, ...fresh };
  }

  const vote = useCallback(
    async (winner: BabyName, loser: BabyName) => {
      if (!user) return;
      setLoading(true);

      try {
        const [winnerScore, loserScore] = await Promise.all([
          getOrCreateScore(user.uid, winner.id, winner.gender),
          getOrCreateScore(user.uid, loser.id, loser.gender),
        ]);

        const { winner: newWinnerElo, loser: newLoserElo } = newRatings(
          winnerScore.eloScore,
          loserScore.eloScore
        );

        await Promise.all([
          setDoc(doc(db, 'userScores', winnerScore.id), {
            ...winnerScore,
            eloScore: newWinnerElo,
            wins: winnerScore.wins + 1,
            matches: winnerScore.matches + 1,
          }),
          setDoc(doc(db, 'userScores', loserScore.id), {
            ...loserScore,
            eloScore: newLoserElo,
            losses: loserScore.losses + 1,
            matches: loserScore.matches + 1,
          }),
          addDoc(collection(db, 'matches'), {
            winnerId: winner.id,
            loserId: loser.id,
            userId: user.uid,
            gender: winner.gender,
            timestamp: serverTimestamp(),
          }),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return { vote, loading };
}
