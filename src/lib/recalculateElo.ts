import { collection, query, where, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { newRatings } from './elo';
import type { Gender } from '../types';

const DEFAULT_ELO = 1000;

/**
 * Replays all remaining matches for a user chronologically and rewrites
 * their userScores from scratch. Call this after deleting any match doc.
 */
export async function recalculateUserElo(userId: string): Promise<void> {
  const [matchesSnap, scoresSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'matches'),
        where('userId', '==', userId),
        orderBy('timestamp', 'asc')
      )
    ),
    getDocs(query(collection(db, 'userScores'), where('userId', '==', userId))),
  ]);

  // Delete all existing userScores for this user
  if (scoresSnap.docs.length > 0) {
    for (let i = 0; i < scoresSnap.docs.length; i += 500) {
      const batch = writeBatch(db);
      scoresSnap.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  if (matchesSnap.empty) return;

  // Replay ELO from scratch in chronological order
  const stats = new Map<string, { elo: number; wins: number; losses: number; matches: number; gender: Gender }>();

  for (const d of matchesSnap.docs) {
    const data = d.data();
    const winnerId = data.winnerId as string;
    const loserId = data.loserId as string;
    const gender = data.gender as Gender;

    if (!stats.has(winnerId)) stats.set(winnerId, { elo: DEFAULT_ELO, wins: 0, losses: 0, matches: 0, gender });
    if (!stats.has(loserId)) stats.set(loserId, { elo: DEFAULT_ELO, wins: 0, losses: 0, matches: 0, gender });

    const w = stats.get(winnerId)!;
    const l = stats.get(loserId)!;
    const { winner: newWElo, loser: newLElo } = newRatings(w.elo, l.elo);

    stats.set(winnerId, { elo: newWElo, wins: w.wins + 1, losses: w.losses, matches: w.matches + 1, gender });
    stats.set(loserId, { elo: newLElo, wins: l.wins, losses: l.losses + 1, matches: l.matches + 1, gender });
  }

  // Write recalculated scores back
  const entries = [...stats.entries()];
  for (let i = 0; i < entries.length; i += 500) {
    const batch = writeBatch(db);
    entries.slice(i, i + 500).forEach(([nameId, s]) => {
      batch.set(doc(db, 'userScores', `${userId}_${nameId}`), {
        userId,
        nameId,
        gender: s.gender,
        eloScore: s.elo,
        wins: s.wins,
        losses: s.losses,
        matches: s.matches,
      });
    });
    await batch.commit();
  }
}
