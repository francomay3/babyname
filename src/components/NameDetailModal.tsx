import { Badge, Center, Loader, Modal, Stack, Text } from '@mantine/core';
import { useRanking } from '../hooks/useRanking';
import { useLocale } from '../context/LocaleContext';
import type { BabyName } from '../types';
import { capitalizeName } from '../lib/utils';

export function NameDetailModal({
  name,
  onClose,
}: {
  name: BabyName | null;
  onClose: () => void;
}) {
  return (
    <Modal opened={!!name} onClose={onClose} centered size="sm" withCloseButton>
      {name && <ModalContent name={name} />}
    </Modal>
  );
}

function ModalContent({ name }: { name: BabyName }) {
  const { t } = useLocale();
  const { combinedRanking, loading } = useRanking(name.gender);

  const genderColor = name.gender === 'female' ? 'pink' : 'blue';

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
