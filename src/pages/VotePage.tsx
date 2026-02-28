import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  Stack,
  SimpleGrid,
  Paper,
  Text,
  Button,
  Badge,
  Center,
  Loader,
  Title,
  Anchor,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useVote } from '../hooks/useVote';
import { useAuth } from '../hooks/useAuth';
import type { BabyName, UserScore } from '../types';

interface Props {
  onGoToNames: () => void;
}

function pickPair(
  names: BabyName[],
  scores: UserScore[],
  votedPairs: Set<string>
): [BabyName, BabyName] | null {
  const withMatches = names.map((name) => {
    const score = scores.find((s) => s.nameId === name.id);
    return { ...name, matches: score?.matches ?? 0 };
  });

  const byGender: Record<string, typeof withMatches> = { female: [], male: [] };
  for (const n of withMatches) byGender[n.gender].push(n);

  const validPairs: [typeof withMatches[0], typeof withMatches[0]][] = [];
  for (const group of Object.values(byGender)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const key = [group[i].id, group[j].id].sort().join('|');
        if (!votedPairs.has(key)) validPairs.push([group[i], group[j]]);
      }
    }
  }

  if (validPairs.length === 0) return null;

  const weights = validPairs.map(([a, b]) => 1 / (a.matches + 1) + 1 / (b.matches + 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < validPairs.length; i++) {
    r -= weights[i];
    if (r <= 0) return validPairs[i];
  }
  return validPairs[validPairs.length - 1];
}

export function VotePage({ onGoToNames }: Props) {
  const { user } = useAuth();
  const { vote } = useVote();

  const [savedPairIds, setSavedPairIds] = useLocalStorage<[string, string] | null>({
    key: 'babyname-current-pair',
    defaultValue: null,
  });

  const [names, setNames] = useState<BabyName[]>([]);
  const [pair, setPair] = useState<[BabyName, BabyName] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [namesLoaded, setNamesLoaded] = useState(false);
  const [votedPairsLoaded, setVotedPairsLoaded] = useState(false);
  const [noPairsLeft, setNoPairsLeft] = useState(false);
  const [pairStyle, setPairStyle] = useState<CSSProperties>({});

  // Refs so setTimeout callbacks always read the latest values
  const namesRef = useRef<BabyName[]>([]);
  const scoresRef = useRef<UserScore[]>([]);
  const votedPairsRef = useRef<Set<string>>(new Set());

  namesRef.current = names;

  const isLoading = !namesLoaded || !votedPairsLoaded;

  // Load ALL names (both genders)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'names'), (snap) => {
      const loaded = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<BabyName, 'id' | 'addedAt'>),
        addedAt: doc.data().addedAt?.toDate() ?? new Date(),
      }));
      setNames(loaded);
      namesRef.current = loaded;
      setNamesLoaded(true);
    });
    return unsub;
  }, []);

  // Load all user scores
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'userScores'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      scoresRef.current = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<UserScore, 'id'>),
      }));
    });
    return unsub;
  }, [user]);

  // Load voted pairs from match history
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'matches'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const pairs = new Set<string>();
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const key = [data.winnerId as string, data.loserId as string].sort().join('|');
        pairs.add(key);
      });
      votedPairsRef.current = pairs;
      setVotedPairsLoaded(true);
    });
    return unsub;
  }, [user]);

  function computeNextPair() {
    return pickPair(namesRef.current, scoresRef.current, votedPairsRef.current);
  }

  // Show a pair — with optional right-to-left slide-in animation
  function showNewPair(result: [BabyName, BabyName] | null, animate: boolean) {
    setPicked(null);
    if (result === null) {
      setNoPairsLeft(true);
      setPair(null);
      setSavedPairIds(null);
      setPairStyle({});
      return;
    }
    setNoPairsLeft(false);
    setSavedPairIds([result[0].id, result[1].id]);
    setPair(result);

    if (animate) {
      // Start off-screen to the right
      setPairStyle({ opacity: 0, transform: 'translateX(32px)', transition: 'none' });
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setPairStyle({
            opacity: 1,
            transform: 'translateX(0)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          })
        )
      );
    } else {
      setPairStyle({ opacity: 1 });
    }
  }

  // Exit to the left, then load next pair from the right
  function transitionToNext() {
    setPairStyle({
      opacity: 0,
      transform: 'translateX(-32px)',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
      pointerEvents: 'none',
    });
    setTimeout(() => showNewPair(computeNextPair(), true), 155);
  }

  // Initial load: restore saved pair or compute a fresh one
  useEffect(() => {
    if (!isLoading) {
      let result: [BabyName, BabyName] | null = null;
      if (savedPairIds) {
        const [id1, id2] = savedPairIds;
        const name1 = namesRef.current.find((n) => n.id === id1);
        const name2 = namesRef.current.find((n) => n.id === id2);
        const key = [id1, id2].sort().join('|');
        if (name1 && name2 && !votedPairsRef.current.has(key)) {
          result = [name1, name2];
        }
      }
      if (!result) result = computeNextPair();
      showNewPair(result, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  function handleVote(winner: BabyName, loser: BabyName) {
    if (picked) return;
    setPicked(winner.id);
    const key = [winner.id, loser.id].sort().join('|');
    votedPairsRef.current = new Set([...votedPairsRef.current, key]);

    // Optimistic: show ❤️ briefly then slide to next pair — don't wait for Firestore
    setTimeout(transitionToNext, 450);

    vote(winner, loser).catch(() => {
      // Rollback: pair becomes available again in future rounds
      votedPairsRef.current = new Set([...votedPairsRef.current].filter((k) => k !== key));
      notifications.show({
        color: 'red',
        title: 'Error al votar',
        message: 'No se pudo guardar el voto. El duelo volvió a la lista.',
      });
    });
  }

  const femaleCount = names.filter((n) => n.gender === 'female').length;
  const maleCount = names.filter((n) => n.gender === 'male').length;
  const hasEnoughNames = femaleCount >= 2 || maleCount >= 2;

  if (isLoading) {
    return (
      <Center h={300}>
        <Loader color="pink" />
      </Center>
    );
  }

  if (!hasEnoughNames) {
    return (
      <Center h={300}>
        <Stack align="center" gap="md">
          <Text fz={48}>😅</Text>
          <Title order={3} ta="center">
            Necesitás al menos 2 nombres para votar.
          </Title>
          <Anchor component="button" onClick={onGoToNames} c="pink.6" fz="sm">
            Agregá más nombres en la pestaña "Nombres" →
          </Anchor>
        </Stack>
      </Center>
    );
  }

  if (noPairsLeft) {
    return (
      <Center h={300}>
        <Stack align="center" gap="md">
          <Text fz={48}>🎉</Text>
          <Title order={3} ta="center">
            ¡Votaste todos los duelos posibles!
          </Title>
          <Text c="dimmed" ta="center" fz="sm">
            Cuando se agreguen nuevos nombres van a aparecer nuevos duelos.
          </Text>
          <Anchor component="button" onClick={onGoToNames} c="pink.6" fz="sm">
            Ir a agregar nombres →
          </Anchor>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Title order={3} ta="center">
        ¿Cuál te gusta más?
      </Title>

      {pair && (
        <SimpleGrid cols={2} spacing="lg" style={pairStyle}>
          {pair.map((name, idx) => {
            const opponent = pair[idx === 0 ? 1 : 0];
            const isWinner = picked === name.id;
            const isLoser = !!picked && picked !== name.id;
            const color = name.gender === 'female' ? 'pink' : 'blue';

            return (
              <Paper
                key={name.id}
                shadow={isWinner ? 'xl' : 'sm'}
                radius="xl"
                p="xl"
                withBorder
                onClick={() => !picked && handleVote(name, opponent)}
                style={{
                  cursor: picked ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isWinner ? 'scale(1.04)' : isLoser ? 'scale(0.97)' : undefined,
                  opacity: isLoser ? 0.45 : 1,
                  borderColor: isWinner ? `var(--mantine-color-${color}-5)` : undefined,
                  background: isWinner ? `var(--mantine-color-${color}-0)` : undefined,
                }}
              >
                <Center h={120}>
                  <Stack align="center" gap="sm">
                    <Text fz={36} fw={700} c={isWinner ? `${color}.6` : 'dark'} ta="center">
                      {name.text}
                    </Text>
                    <Badge size="sm" color={color} variant="light" radius="xl">
                      {name.gender === 'female' ? '👧 Nena' : '👦 Nene'}
                    </Badge>
                    {isWinner && (
                      <Text fz={28} style={{ lineHeight: 1 }}>
                        ❤️
                      </Text>
                    )}
                  </Stack>
                </Center>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      <Center>
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          radius="xl"
          onClick={transitionToNext}
          disabled={!!picked}
        >
          Saltar este duelo
        </Button>
      </Center>
    </Stack>
  );
}
