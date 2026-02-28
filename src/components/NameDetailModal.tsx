import { Avatar, Badge, Center, Group, Loader, Modal, Stack, Text, UnstyledButton } from '@mantine/core';
import { useAuth } from '../hooks/useAuth';
import { useRanking } from '../hooks/useRanking';
import { useLocale } from '../context/LocaleContext';
import type { BabyName } from '../types';
import { capitalizeName } from '../lib/utils';

export function NameDetailModal({
  name,
  onClose,
  onNavigateToUser,
}: {
  name: BabyName | null;
  onClose: () => void;
  onNavigateToUser?: (uid: string) => void;
}) {
  function handleNavigate(uid: string) {
    onClose();
    onNavigateToUser?.(uid);
  }
  return (
    <Modal opened={!!name} onClose={onClose} centered size="sm" withCloseButton>
      {name && <ModalContent name={name} onNavigateToUser={onNavigateToUser ? handleNavigate : undefined} />}
    </Modal>
  );
}

function ModalContent({ name, onNavigateToUser }: { name: BabyName; onNavigateToUser?: (uid: string) => void }) {
  const { allUsers } = useAuth();
  const { t } = useLocale();
  const { combinedRanking, loading } = useRanking(name.gender);

  const genderColor = name.gender === 'female' ? 'pink' : 'blue';
  const proposer = allUsers.find((u) => u.uid === name.addedBy);

  const votedRanking = combinedRanking.filter((n) => n.matches > 0);
  const position = votedRanking.findIndex((n) => n.id === name.id) + 1;
  const hasVotes = position > 0;

  return (
    <Stack align="center" gap="xl" py="sm">
      {/* Name + gender */}
      <Stack align="center" gap="xs">
        <Text fz={44} fw={800} lh={1} ta="center">
          {capitalizeName(name.text)}
        </Text>
        <Badge color={genderColor} variant="light" radius="xl" size="lg">
          {name.gender === 'female' ? t.femaleLabel : t.maleLabel}
        </Badge>
      </Stack>

      {/* Proposer */}
      <UnstyledButton
        onClick={() => proposer && onNavigateToUser?.(proposer.uid)}
        style={{ cursor: proposer && onNavigateToUser ? 'pointer' : 'default' }}
      >
        <Group gap="sm" align="center">
          <Avatar src={proposer?.photoURL || undefined} size="sm" radius="xl">
            {proposer?.displayName?.[0]}
          </Avatar>
          <Text fz="sm" c="dimmed">
            {t.nameModalProposedBy}{' '}
            <Text span fw={600} c={proposer && onNavigateToUser ? 'blue' : 'dark'} td={proposer && onNavigateToUser ? 'underline' : undefined}>
              {proposer?.displayName ?? '?'}
            </Text>
          </Text>
        </Group>
      </UnstyledButton>

      {/* Combined ranking */}
      {loading ? (
        <Center h={60}>
          <Loader size="sm" color="pink" />
        </Center>
      ) : hasVotes ? (
        <Stack align="center" gap={2}>
          <Text fz="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.08em' }}>
            {t.nameModalRanking}
          </Text>
          <Text fz={48} fw={900} c={`${genderColor}.6`} lh={1}>
            #{position}
          </Text>
          <Text fz="xs" c="dimmed">
            {t.nameModalOf(votedRanking.length)}
          </Text>
        </Stack>
      ) : (
        <Text fz="sm" c="dimmed">
          {t.nameModalNoVotes}
        </Text>
      )}
    </Stack>
  );
}
