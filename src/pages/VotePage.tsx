import { useState, useEffect, useCallback, useRef } from 'react';
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
        if (!votedPairs.has(key)) {
          validPairs.push([group[i], group[j]]);
        }
      }
    }
  }

  if (validPairs.length === 0) return null;

  // Weight each pair by the sum of 1/(matches+1) for both names
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
  const { vote, loading: voteLoading } = useVote();

  const [names, setNames] = useState<BabyName[]>([]);
  const [scores, setScores] = useState<UserScore[]>([]);
  const [pair, setPair] = useState<[BabyName, BabyName] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noPairsLeft, setNoPairsLeft] = useState(false);

  const votedPairsRef = useRef<Set<string>>(new Set());
  const getNextPairRef = useRef<() => void>(() => {});

  // Load ALL names (both genders)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'names'), (snap) => {
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
  }, []);

  // Load all user scores
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'userScores'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setScores(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserScore, 'id'>),
        }))
      );
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
    });
    return unsub;
  }, [user]);

  const getNextPair = useCallback(() => {
    const result = pickPair(names, scores, votedPairsRef.current);
    if (result === null) {
      setNoPairsLeft(true);
      setPair(null);
    } else {
      setNoPairsLeft(false);
      setPair(result);
    }
    setPicked(null);
  }, [names, scores]);

  // Keep ref in sync so setTimeout always calls the latest version
  useEffect(() => {
    getNextPairRef.current = getNextPair;
  }, [getNextPair]);

  // Initial load
  useEffect(() => {
    if (!loading) getNextPair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function handleVote(winner: BabyName, loser: BabyName) {
    if (picked) return;
    setPicked(winner.id);
    // Optimistically mark this pair as voted so getNextPair won't reuse it
    const key = [winner.id, loser.id].sort().join('|');
    votedPairsRef.current = new Set([...votedPairsRef.current, key]);
    await vote(winner, loser);
    setTimeout(() => getNextPairRef.current(), 800);
  }

  const femaleCount = names.filter((n) => n.gender === 'female').length;
  const maleCount = names.filter((n) => n.gender === 'male').length;
  const hasEnoughNames = femaleCount >= 2 || maleCount >= 2;

  if (loading) {
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
        <SimpleGrid cols={2} spacing="lg">
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
                    {voteLoading && isWinner && <Loader size="xs" color={color} />}
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
          onClick={getNextPair}
          disabled={!!picked}
        >
          Saltar este duelo
        </Button>
      </Center>
    </Stack>
  );
}
