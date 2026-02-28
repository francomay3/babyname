import { useState } from 'react';
import {
  Stack,
  Tabs,
  Table,
  Text,
  Badge,
  Group,
  Avatar,
  Tooltip,
  Center,
  Loader,
  Title,
  SegmentedControl,
  Paper,
} from '@mantine/core';
import { useRanking } from '../hooks/useRanking';
import type { RankedName, Gender } from '../types';
import { useAuth } from '../hooks/useAuth';

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankingPage() {
  const [gender, setGender] = useState<Gender>('female');
  const [view, setView] = useState<'mine' | 'combined'>('combined');
  const { myRanking, combinedRanking, loading } = useRanking(gender);
  const { user } = useAuth();

  const ranking = view === 'mine' ? myRanking : combinedRanking;
  const genderColor = gender === 'female' ? 'pink' : 'blue';

  if (loading) {
    return (
      <Center h={300}>
        <Loader color="pink" />
      </Center>
    );
  }

  const hasVotes = ranking.some((n) => n.matches > 0);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Title order={3} c={`${genderColor}.6`}>
          🏆 Ranking
        </Title>
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as 'mine' | 'combined')}
          data={[
            { label: '👥 Combinado', value: 'combined' },
            { label: '👤 El mío', value: 'mine' },
          ]}
          color={genderColor}
          radius="xl"
          size="xs"
        />
      </Group>

      <Tabs value={gender} onChange={(v) => setGender(v as Gender)}>
        <Tabs.List grow>
          <Tabs.Tab value="female" color="pink">
            👧 Nenas
          </Tabs.Tab>
          <Tabs.Tab value="male" color="blue">
            👦 Nenes
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {!hasVotes ? (
        <Center h={200}>
          <Stack align="center" gap="sm">
            <Text fz={40}>🗳️</Text>
            <Text c="dimmed" ta="center">
              Todavía no hay votos para{' '}
              {gender === 'female' ? 'nenas' : 'nenes'}. ¡Empezá a votar!
            </Text>
          </Stack>
        </Center>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th ta="right">ELO</Table.Th>
                <Table.Th ta="right">W / L</Table.Th>
                {view === 'combined' && <Table.Th ta="right">Desglose</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ranking.map((name, idx) => (
                <RankingRow
                  key={name.id}
                  name={name}
                  position={idx + 1}
                  showBreakdown={view === 'combined'}
                  currentUserId={user?.uid}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}

function RankingRow({
  name,
  position,
  showBreakdown,
  currentUserId,
}: {
  name: RankedName;
  position: number;
  showBreakdown: boolean;
  currentUserId?: string;
}) {
  const medal = MEDALS[position - 1];
  const hasData = name.matches > 0;

  return (
    <Table.Tr style={{ opacity: hasData ? 1 : 0.5 }}>
      <Table.Td>
        <Text fw={700} c="dimmed" fz="sm">
          {medal ?? position}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fw={position <= 3 ? 700 : 400}>{name.text}</Text>
      </Table.Td>
      <Table.Td ta="right">
        {hasData ? (
          <Badge
            variant="filled"
            color={name.eloScore >= 1000 ? 'teal' : 'red'}
            radius="xl"
          >
            {name.eloScore}
          </Badge>
        ) : (
          <Text c="dimmed" fz="xs">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td ta="right">
        <Text fz="sm" c="dimmed">
          {hasData ? `${name.wins} / ${name.losses}` : '—'}
        </Text>
      </Table.Td>
      {showBreakdown && (
        <Table.Td ta="right">
          <Group justify="flex-end" gap={4}>
            {name.allScores?.map((s) => (
              <Tooltip
                key={s.userId}
                label={`${s.displayName}: ${s.eloScore}`}
                position="top"
              >
                <Avatar
                  size="sm"
                  radius="xl"
                  color={s.userId === currentUserId ? 'pink' : 'gray'}
                >
                  {s.displayName[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  );
}
