import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export type Phase = 'add' | 'selecting' | 'vote';

function computePhase(date1: Date, date2: Date): Phase {
  const now = new Date();
  if (now < date1) return 'add';
  if (now < date2) return 'selecting';
  return 'vote';
}

export function usePhases() {
  const [date1, setDate1] = useState<Date | null>(null);
  const [date2, setDate2] = useState<Date | null>(null);
  const [phase, setPhase] = useState<Phase>('add');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'phases'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const d1: Date | null = data.date1?.toDate() ?? null;
        const d2: Date | null = data.date2?.toDate() ?? null;
        setDate1(d1);
        setDate2(d2);
        setPhase(d1 && d2 ? computePhase(d1, d2) : 'add');
      } else {
        setPhase('add');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { date1, date2, phase, loading };
}
