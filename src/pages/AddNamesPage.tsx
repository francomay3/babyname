import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  TextInput,
  Button,
  SegmentedControl,
  Group,
  Text,
  Badge,
  SimpleGrid,
  Paper,
  Title,
  Divider,
  Alert,
  Center,
  ActionIcon,
  Loader,
  Modal,
} from '@mantine/core';
import { IconPlus, IconInfoCircle, IconLock, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNames } from '../hooks/useNames';
import { useAdmin } from '../hooks/useAdmin';
import { useLocale } from '../context/LocaleContext';
import { usePhases } from '../hooks/usePhases';
import { NameDetailModal } from '../components/NameDetailModal';
import type { BabyName, Gender } from '../types';
import { capitalizeName, formatPhaseDate } from '../lib/utils';

interface PendingName {
  id: string;
  text: string;
  gender: Gender;
}

export function AddNamesPage({ onNavigateToUser }: { onNavigateToUser?: (uid: string) => void }) {
  const { t, locale } = useLocale();
  const { phase, date1 } = usePhases();
  const { isAdmin } = useAdmin();
  const [text, setText] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [pendingNames, setPendingNames] = useState<PendingName[]>([]);
  const [recentNames, setRecentNames] = useState<Set<string>>(new Set());
  const [selectedName, setSelectedName] = useState<BabyName | null>(null);
  const { names: allNames, addName, deleteName } = useNames();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const femaleNames = useMemo(() => allNames.filter((n) => n.gender === 'female'), [allNames]);
  const maleNames = useMemo(() => allNames.filter((n) => n.gender === 'male'), [allNames]);

  // Pending names not yet confirmed by Firestore — checked against allNames (not
  // femaleNames/maleNames) so that deleting a just-added name doesn't cause it
  // to reappear from the pending list when deletingIds hides it from the real list.
  const pendingFemale = useMemo(
    () =>
      pendingNames
        .filter(
          (p) =>
            p.gender === 'female' &&
            !allNames.some((n) => n.gender === 'female' && n.text.toLowerCase() === p.text.toLowerCase())
        )
        .map((p) => p.text),
    [pendingNames, allNames]
  );
  const pendingMale = useMemo(
    () =>
      pendingNames
        .filter(
          (p) =>
            p.gender === 'male' &&
            !allNames.some((n) => n.gender === 'male' && n.text.toLowerCase() === p.text.toLowerCase())
        )
        .map((p) => p.text),
    [pendingNames, allNames]
  );

  function handleNameClick(nameText: string, nameGender: Gender) {
    const list = nameGender === 'female' ? femaleNames : maleNames;
    const found = list.find((n) => n.text === nameText);
    if (found) setSelectedName(found);
  }

  const genderColor = gender === 'female' ? 'pink' : 'blue';

  function markRecent(name: string) {
    setRecentNames((prev) => new Set([...prev, name]));
    setTimeout(() => {
      setRecentNames((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, 1200);
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const all = [...femaleNames, ...maleNames];
    const duplicate =
      all.find((n) => n.text.toLowerCase() === trimmed.toLowerCase() && n.gender === gender) ||
      pendingNames.find(
        (n) => n.text.toLowerCase() === trimmed.toLowerCase() && n.gender === gender
      );

    if (duplicate) {
      notifications.show({
        color: 'orange',
        title: t.addNotifDuplicateTitle,
        message:
          gender === 'female'
            ? t.addNotifDuplicateFemaleMsg(trimmed)
            : t.addNotifDuplicateMaleMsg(trimmed),
      });
      return;
    }

    const tempId = `opt_${Date.now()}`;
    setPendingNames((prev) => [...prev, { id: tempId, text: trimmed, gender }]);
    setText('');
    markRecent(trimmed);

    try {
      await addName(trimmed, gender);
      // No success toast — the animation in the list is enough feedback
    } catch {
      setPendingNames((prev) => prev.filter((n) => n.id !== tempId));
      setRecentNames((prev) => {
        const next = new Set(prev);
        next.delete(trimmed);
        return next;
      });
      notifications.show({
        color: 'red',
        title: t.addNotifErrorTitle,
        message: t.addNotifErrorMsg,
      });
    }
  }

  async function handleDelete(nameId: string) {
    const target = allNames.find((n) => n.id === nameId);
    setDeletingIds((prev) => new Set([...prev, nameId]));
    try {
      await deleteName(nameId);
      // Also evict any pending entry for this name so it doesn't resurface
      // after Firestore confirms the deletion and removes it from allNames.
      if (target) {
        setPendingNames((prev) =>
          prev.filter(
            (p) =>
              !(p.gender === target.gender && p.text.toLowerCase() === target.text.toLowerCase())
          )
        );
      }
    } catch {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(nameId);
        return next;
      });
      notifications.show({ color: 'red', message: t.adminErrorMsg });
    }
  }

  if (phase === 'selecting' || phase === 'vote') {
    return (
      <Center h={300}>
        <Stack align="center" gap="md">
          <IconLock size={40} color="var(--mantine-color-gray-5)" />
          <Title order={3} ta="center">
            {t.phaseAddClosed}
          </Title>
          <Text c="dimmed" ta="center" fz="sm">
            {t.phaseAddClosedSub}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      {date1 && (
        <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="lg">
          <span dangerouslySetInnerHTML={{ __html: t.phaseAddNotice(formatPhaseDate(date1, locale)) }} />
        </Alert>
      )}
      <Paper shadow="sm" radius="lg" p="lg" withBorder>
        <Stack gap="md">
          <Title order={3} c={`${genderColor}.6`}>
            {t.addTitle}
          </Title>
          <SegmentedControl
            value={gender}
            onChange={(v) => setGender(v as Gender)}
            data={[
              { label: `👧 ${t.femaleLabel}`, value: 'female' },
              { label: `👦 ${t.maleLabel}`, value: 'male' },
            ]}
            color={genderColor}
            radius="xl"
          />
          <Group>
            <TextInput
              placeholder={t.addPlaceholder}
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              radius="xl"
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleSubmit}
              color={genderColor}
              radius="xl"
            >
              {t.addButton}
            </Button>
          </Group>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xl">
        <NameList
          title={`👧 ${t.femalePluralLabel}`}
          realNames={femaleNames}
          pendingNames={pendingFemale}
          color="pink"
          countLabel={t.addNamesCount(femaleNames.length + pendingFemale.length)}
          emptyLabel={t.addEmptyState}
          recentNames={recentNames}
          onNameClick={(name) => handleNameClick(name, 'female')}
          onDelete={isAdmin ? setConfirmDeleteId : undefined}
          deletingIds={deletingIds}
        />
        <NameList
          title={`👦 ${t.malePluralLabel}`}
          realNames={maleNames}
          pendingNames={pendingMale}
          color="blue"
          countLabel={t.addNamesCount(maleNames.length + pendingMale.length)}
          emptyLabel={t.addEmptyState}
          recentNames={recentNames}
          onNameClick={(name) => handleNameClick(name, 'male')}
          onDelete={isAdmin ? setConfirmDeleteId : undefined}
          deletingIds={deletingIds}
        />
      </SimpleGrid>

      <NameDetailModal name={selectedName} onClose={() => setSelectedName(null)} onNavigateToUser={onNavigateToUser} />

      <Modal
        opened={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title={t.adminConfirmTitle}
        size="sm"
        centered
      >
        <Text size="sm" mb="lg">
          {t.profileDeleteName}:{' '}
          <Text span fw={700}>
            {capitalizeName(allNames.find((n) => n.id === confirmDeleteId)?.text ?? '')}
          </Text>
        </Text>
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={() => setConfirmDeleteId(null)}>
            {t.adminCancel}
          </Button>
          <Button
            color="red"
            size="sm"
            onClick={() => {
              if (confirmDeleteId) handleDelete(confirmDeleteId);
              setConfirmDeleteId(null);
            }}
          >
            {t.profileDeleteName}
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

function NameList({
  title,
  realNames,
  pendingNames,
  color,
  countLabel,
  emptyLabel,
  recentNames,
  onNameClick,
  onDelete,
  deletingIds,
}: {
  title: string;
  realNames: BabyName[];
  pendingNames: string[];
  color: string;
  countLabel: string;
  emptyLabel: string;
  recentNames: Set<string>;
  onNameClick: (name: string) => void;
  onDelete?: (id: string) => void;
  deletingIds?: Set<string>;
}) {
  const isEmpty = realNames.length === 0 && pendingNames.length === 0;
  return (
    <Paper shadow="sm" radius="lg" p="lg" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
          <Badge color={color} variant="light" radius="xl">
            {countLabel}
          </Badge>
        </Group>
        <Divider />
        {isEmpty ? (
          <Text c="dimmed" fz="sm" ta="center" py="md">
            {emptyLabel}
          </Text>
        ) : (
          <Stack gap={4}>
            {realNames.map((name) => (
              <NameItem
                key={name.id}
                name={name.text}
                color={color}
                isNew={recentNames.has(name.text)}
                onClick={() => onNameClick(name.text)}
                onDelete={onDelete ? () => onDelete(name.id) : undefined}
                isDeleting={deletingIds?.has(name.id) ?? false}
              />
            ))}
            {pendingNames.map((name) => (
              <NameItem
                key={name}
                name={name}
                color={color}
                isNew={recentNames.has(name)}
                onClick={() => onNameClick(name)}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function NameItem({
  name,
  color,
  isNew,
  onClick,
  onDelete,
  isDeleting = false,
}: {
  name: string;
  color: string;
  isNew: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  // Pre-existing items start fully visible (no animation).
  // New items start hidden and slide in via double-rAF.
  const [entered, setEntered] = useState(!isNew);

  useEffect(() => {
    if (!entered) {
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      px="xs"
      py={4}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateX(0)' : 'translateX(-10px)',
        backgroundColor:
          isNew && entered ? `var(--mantine-color-${color}-1)` : 'transparent',
        borderRadius: 6,
        transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 1s ease',
      }}
    >
      <Text fz="sm" onClick={onClick} style={{ cursor: 'pointer', flex: 1 }}>
        {capitalizeName(name)}
      </Text>
      {isDeleting ? (
        <Loader size="xs" color="red" />
      ) : onDelete ? (
        <ActionIcon
          variant="subtle"
          color="red"
          size="xs"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <IconTrash size={12} />
        </ActionIcon>
      ) : null}
    </Group>
  );
}
