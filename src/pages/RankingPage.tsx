import { useState } from 'react';
import {
  Stack,
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
import { useLocale } from '../context/LocaleContext';
import type { RankedName } from '../types';
import { useAuth } from '../hooks/useAuth';

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankingPage() {
  const [view, setView] = useState<'mine' | 'combined'>('combined');
  const { myRanking: femaleMyRanking, combinedRanking: femaleCombinedRanking, loading: femaleLoading } = useRanking('female');
  const { myRanking: maleMyRanking, combinedRanking: maleCombinedRanking, loading: maleLoading } = useRanking('male');
  const { user } = useAuth();
  const { t } = useLocale();

  if (femaleLoading || maleLoading) {
    return (
      <Center h={300}>
        <Loader color="pink" />
      </Center>
    );
  }

  const femaleRanking = view === 'mine' ? femaleMyRanking : femaleCombinedRanking;
  const maleRanking = view === 'mine' ? maleMyRanking : maleCombinedRanking;

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={3}>{t.rankingTitle}</Title>
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as 'mine' | 'combined')}
          data={[
            { label: t.rankingCombined, value: 'combined' },
            { label: t.rankingMine, value: 'mine' },
          ]}
          color="pink"
          radius="xl"
          size="xs"
        />
      </Group>

      <GenderSection
        title={`👧 ${t.femalePluralLabel}`}
        color="pink"
        ranking={femaleRanking}
        view={view}
        currentUserId={user?.uid}
        noVotesMsg={t.rankingNoVotesFemale}
        t={t}
      />

      <GenderSection
        title={`👦 ${t.malePluralLabel}`}
        color="blue"
        ranking={maleRanking}
        view={view}
        currentUserId={user?.uid}
        noVotesMsg={t.rankingNoVotesMale}
        t={t}
      />
    </Stack>
  );
}

function GenderSection({
  title,
  color,
  ranking,
  view,
  currentUserId,
  noVotesMsg,
  t,
}: {
  title: string;
  color: string;
  ranking: RankedName[];
  view: 'mine' | 'combined';
  currentUserId?: string;
  noVotesMsg: string;
  t: ReturnType<typeof useLocale>['t'];
}) {
  const hasVotes = ranking.some((n) => n.matches > 0);

  return (
    <Stack gap="sm">
      <Title order={4} c={`${color}.6`}>
        {title}
      </Title>
      {!hasVotes ? (
        <Center h={100}>
          <Stack align="center" gap="xs">
            <Text fz={32}>🗳️</Text>
            <Text c="dimmed" ta="center" fz="sm">
              {noVotesMsg}
            </Text>
          </Stack>
        </Center>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>{t.rankingColName}</Table.Th>
                <Table.Th ta="right">{t.rankingColElo}</Table.Th>
                <Table.Th ta="right">{t.rankingColWL}</Table.Th>
                {view === 'combined' && <Table.Th ta="right">{t.rankingColBreakdown}</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ranking.map((name, idx) => (
                <RankingRow
                  key={name.id}
                  name={name}
                  position={idx + 1}
                  showBreakdown={view === 'combined'}
                  currentUserId={currentUserId}
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
          <Badge variant="filled" color={name.eloScore >= 1000 ? 'teal' : 'red'} radius="xl">
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
              <Tooltip key={s.userId} label={`${s.displayName}: ${s.eloScore}`} position="top">
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
