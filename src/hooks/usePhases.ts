import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type Phase = 'add' | 'selecting' | 'vote';

function defaultDate1() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultDate2() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computePhase(date1: Date, date2: Date): Phase {
  const now = new Date();
  if (now < date1) return 'add';
  if (now < date2) return 'selecting';
  return 'vote';
}

export function usePhases() {
  const [date1, setDate1] = useState<Date>(defaultDate1);
  const [date2, setDate2] = useState<Date>(defaultDate2);
  const [phase, setPhase] = useState<Phase>('add');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'phases'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const d1: Date = data.date1?.toDate() ?? defaultDate1();
        const d2: Date = data.date2?.toDate() ?? defaultDate2();
        setDate1(d1);
        setDate2(d2);
        setPhase(computePhase(d1, d2));
      } else {
        const d1 = defaultDate1();
        const d2 = defaultDate2();
        void setDoc(doc(db, 'config', 'phases'), { date1: d1, date2: d2 });
        setDate1(d1);
        setDate2(d2);
        setPhase('add');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { date1, date2, phase, loading };
}
