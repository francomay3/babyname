import { useState, useOptimistic, startTransition } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { useNames } from '../hooks/useNames';
import { useRanking } from '../hooks/useRanking';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLocale } from '../context/LocaleContext';
import { NameDetailModal } from '../components/NameDetailModal';
import type { BabyName, RankedName } from '../types';
import { capitalizeName } from '../lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

export function UserProfilePage({
  userId,
  onBack,
}: {
  userId: string;
  onBack: () => void;
}) {
  const { user, allUsers } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLocale();
  const { names: allNames, deleteName } = useNames();
  const { matches, loading: profileLoading, resetVotes, deleteMatch } = useUserProfile(userId);
  const { buildRanking: buildFemale, loading: femaleLoading } = useRanking('female');
  const { buildRanking: buildMale, loading: maleLoading } = useRanking('male');

  const [genderView, setGenderView] = useState<'female' | 'male'>('female');
  const [confirmDeleteVotes, setConfirmDeleteVotes] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<BabyName | null>(null);
  const [showAllVotes, setShowAllVotes] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwnProfile = user?.uid === userId;
  const canDeleteVotes = isAdmin || isOwnProfile;
  const canDeleteNames = isAdmin;

  const userInfo = allUsers.find((u) => u.uid === userId);
  const userNames = allNames.filter((n) => n.addedBy === userId);
  const [optimisticNames, removeOptimistic] = useOptimistic(
    userNames,
    (current, deletedId: string) => current.filter((n) => n.id !== deletedId)
  );
  const [optimisticMatches, removeOptimisticMatch] = useOptimistic(
    matches,
    (current, deletedId: string) => current.filter((m) => m.id !== deletedId)
  );

  const femaleRanking = buildFemale(userId);
  const maleRanking = buildMale(userId);
  const ranking = genderView === 'female' ? femaleRanking : maleRanking;

  const totalDuels = optimisticMatches.length;

  async function handleDeleteVotes() {
    setBusy(true);
    try {
      await resetVotes();
      notifications.show({ color: 'green', message: t.adminDeleteVotesSuccess });
      setConfirmDeleteVotes(false);
    } catch {
      notifications.show({ color: 'red', message: t.adminErrorMsg });
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteMatch(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    startTransition(async () => {
      removeOptimisticMatch(matchId);
      try {
        await deleteMatch(match);
      } catch {
        notifications.show({ color: 'red', message: t.adminErrorMsg });
      }
    });
  }

  async function handleDeleteName() {
    if (!confirmDeleteName) return;
    const nameId = confirmDeleteName;
    setConfirmDeleteName(null);
    startTransition(async () => {
      removeOptimistic(nameId);
      try {
        await deleteName(nameId);
      } catch {
        notifications.show({ color: 'red', message: t.adminErrorMsg });
      }
    });
  }

  if (profileLoading || femaleLoading || maleLoading) {
    return (
      <Center h={300}>
        <Loader color="pink" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      {/* ── Header ── */}
      <Group gap="sm">
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={onBack} aria-label={t.profileBack}>
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Avatar src={userInfo?.photoURL || undefined} size="lg" radius="xl">
          {userInfo?.displayName?.[0]}
        </Avatar>
        <div>
          <Text fw={700} fz="lg">{userInfo?.displayName ?? userId}</Text>
          <Text fz="xs" c="dimmed">
            {t.adminNamesCount(optimisticNames.length)} · {t.adminVotesCount(totalDuels)}
          </Text>
        </div>
      </Group>

      {/* ── Ranking ── */}
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>{t.profileRankingSection}</Title>
          <SegmentedControl
            value={genderView}
            onChange={(v) => setGenderView(v as 'female' | 'male')}
            data={[
              { label: `👧 ${t.femalePluralLabel}`, value: 'female' },
              { label: `👦 ${t.malePluralLabel}`, value: 'male' },
            ]}
            size="xs"
            color={genderView === 'female' ? 'pink' : 'blue'}
            radius="xl"
          />
        </Group>
        <ProfileRankingTable ranking={ranking} noVotesMsg={genderView === 'female' ? t.rankingNoVotesFemale : t.rankingNoVotesMale} onNameClick={setSelectedName} />
      </Stack>

      {/* ── Names ── */}
      <Stack gap="sm">
        <Title order={4}>{t.profileNamesSection}</Title>
        {optimisticNames.length === 0 ? (
          <Center h={60}>
            <Text c="dimmed" fz="sm">{t.profileNoNames}</Text>
          </Center>
        ) : (
          <Stack gap={6}>
            {optimisticNames.map((name) => (
              <Group key={name.id} justify="space-between" wrap="nowrap">
                <UnstyledButton onClick={() => setSelectedName(name)} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      variant="light"
                      color={name.gender === 'female' ? 'pink' : 'blue'}
                      radius="xl"
                      size="sm"
                    >
                      {name.gender === 'female' ? t.femaleLabel : t.maleLabel}
                    </Badge>
                    <Text fz="sm">{capitalizeName(name.text)}</Text>
                  </Group>
                </UnstyledButton>
                {canDeleteNames && (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    title={t.profileDeleteName}
                    onClick={() => setConfirmDeleteName(name.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>
            ))}
          </Stack>
        )}
      </Stack>

      {/* ── Votes ── */}
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title order={4}>{t.profileVotesSection}</Title>
          {canDeleteVotes && totalDuels > 0 && (
            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconTrash size={12} />}
              onClick={() => setConfirmDeleteVotes(true)}
            >
              {t.adminDeleteVotes}
            </Button>
          )}
        </Group>
        {totalDuels === 0 ? (
          <Center h={60}>
            <Text c="dimmed" fz="sm">{t.profileNoVotes}</Text>
          </Center>
        ) : (
          <Stack gap={4}>
            {(showAllVotes ? optimisticMatches : optimisticMatches.slice(0, 10)).map((match) => {
              const winner = allNames.find((n) => n.id === match.winnerId);
              const loser = allNames.find((n) => n.id === match.loserId);
              return (
                <Group key={match.id} gap="xs" wrap="nowrap">
                  <Text fz="xs" fw={500} style={{ flex: 1 }} lineClamp={1}>
                    ✅ {winner ? capitalizeName(winner.text) : '?'}
                  </Text>
                  <Text fz="xs" c="dimmed">vs</Text>
                  <Text fz="xs" style={{ flex: 1 }} lineClamp={1}>
                    ❌ {loser ? capitalizeName(loser.text) : '?'}
                  </Text>
                  <Text fz="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {match.createdAt.toLocaleDateString()}
                  </Text>
                  {isAdmin && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => handleDeleteMatch(match.id)}
                    >
                      <IconTrash size={11} />
                    </ActionIcon>
                  )}
                </Group>
              );
            })}
            {totalDuels > 10 && (
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                onClick={() => setShowAllVotes((v) => !v)}
              >
                {showAllVotes ? t.profileVotesShowLess : t.profileVotesMore(totalDuels - 10)}
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      <NameDetailModal name={selectedName} onClose={() => setSelectedName(null)} />

      {/* ── Confirm delete votes modal ── */}
      <Modal
        opened={confirmDeleteVotes}
        onClose={() => setConfirmDeleteVotes(false)}
        title={t.adminConfirmTitle}
        size="sm"
        centered
      >
        <Text fz="sm" mb="lg">
          {t.adminDeleteVotes}: {userInfo?.displayName}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={() => setConfirmDeleteVotes(false)}>
            {t.adminCancel}
          </Button>
          <Button color="orange" size="sm" loading={busy} onClick={handleDeleteVotes}>
            {t.adminConfirm}
          </Button>
        </Group>
      </Modal>

      {/* ── Confirm delete name modal ── */}
      <Modal
        opened={!!confirmDeleteName}
        onClose={() => setConfirmDeleteName(null)}
        title={t.adminConfirmTitle}
        size="sm"
        centered
      >
        <Text fz="sm" mb="lg">
          {t.profileDeleteName}: <Text span fw={700}>{capitalizeName(allNames.find((n) => n.id === confirmDeleteName)?.text ?? '')}</Text>
        </Text>
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={() => setConfirmDeleteName(null)}>
            {t.adminCancel}
          </Button>
          <Button color="red" size="sm" loading={busy} onClick={handleDeleteName}>
            {t.adminConfirm}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

function ProfileRankingTable({
  ranking,
  noVotesMsg,
  onNameClick,
}: {
  ranking: RankedName[];
  noVotesMsg: string;
  onNameClick: (name: BabyName) => void;
}) {
  const { t } = useLocale();
  const hasVotes = ranking.some((n) => n.matches > 0);

  if (!hasVotes) {
    return (
      <Center h={60}>
        <Text c="dimmed" fz="sm">{noVotesMsg}</Text>
      </Center>
    );
  }

  return (
    <Paper shadow="sm" radius="lg" withBorder>
      <Table striped highlightOnHover horizontalSpacing="xs" verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>{t.rankingColName}</Table.Th>
            <Table.Th ta="right">{t.rankingColElo}</Table.Th>
            <Table.Th ta="right" visibleFrom="xs">{t.rankingColWL}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {ranking.map((name, idx) => (
            <Table.Tr key={name.id} style={{ opacity: name.matches > 0 ? 1 : 0.4, cursor: 'pointer' }} onClick={() => onNameClick(name)}>
              <Table.Td>
                <Text fw={700} c="dimmed" fz="sm">{MEDALS[idx] ?? idx + 1}</Text>
              </Table.Td>
              <Table.Td>
                <Text fw={idx < 3 ? 700 : 400} fz="sm">{capitalizeName(name.text)}</Text>
              </Table.Td>
              <Table.Td ta="right">
                {name.matches > 0 ? (
                  <Badge variant="filled" color={name.eloScore >= 1000 ? 'teal' : 'red'} radius="xl" size="sm">
                    {name.eloScore}
                  </Badge>
                ) : (
                  <Text c="dimmed" fz="xs">—</Text>
                )}
              </Table.Td>
              <Table.Td ta="right" visibleFrom="xs">
                <Text fz="xs" c="dimmed">
                  {name.matches > 0 ? `${name.wins} / ${name.losses}` : '—'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

// Re-export so AdminPage can use it as a simple profile link button
export function ProfileLink({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate: (uid: string) => void;
}) {
  const { allUsers } = useAuth();
  const userInfo = allUsers.find((u) => u.uid === userId);
  return (
    <UnstyledButton onClick={() => onNavigate(userId)}>
      <Text fz="sm" c="pink.6" td="underline">
        {userInfo?.displayName ?? userId}
      </Text>
    </UnstyledButton>
  );
}
