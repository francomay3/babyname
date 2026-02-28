import { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNames } from '../hooks/useNames';
import { useLocale } from '../context/LocaleContext';
import type { Gender } from '../types';

interface PendingName {
  id: string;
  text: string;
  gender: Gender;
}

export function AddNamesPage() {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [pendingNames, setPendingNames] = useState<PendingName[]>([]);
  const [recentNames, setRecentNames] = useState<Set<string>>(new Set());
  const { names: femaleNames } = useNames('female');
  const { names: maleNames, addName } = useNames('male');

  const genderColor = gender === 'female' ? 'pink' : 'blue';

  // Remove pending names that Firestore has now confirmed
  useEffect(() => {
    setPendingNames((prev) => {
      if (prev.length === 0) return prev;
      return prev.filter((p) => {
        const realList = p.gender === 'female' ? femaleNames : maleNames;
        return !realList.some((n) => n.text.toLowerCase() === p.text.toLowerCase());
      });
    });
  }, [femaleNames, maleNames]);

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

  const displayFemale = [
    ...femaleNames.map((n) => n.text),
    ...pendingNames.filter((n) => n.gender === 'female').map((n) => n.text),
  ];
  const displayMale = [
    ...maleNames.map((n) => n.text),
    ...pendingNames.filter((n) => n.gender === 'male').map((n) => n.text),
  ];

  return (
    <Stack gap="xl">
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

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        <NameList
          title={`👧 ${t.femalePluralLabel}`}
          names={displayFemale}
          color="pink"
          countLabel={t.addNamesCount(displayFemale.length)}
          emptyLabel={t.addEmptyState}
          recentNames={recentNames}
        />
        <NameList
          title={`👦 ${t.malePluralLabel}`}
          names={displayMale}
          color="blue"
          countLabel={t.addNamesCount(displayMale.length)}
          emptyLabel={t.addEmptyState}
          recentNames={recentNames}
        />
      </SimpleGrid>
    </Stack>
  );
}

function NameList({
  title,
  names,
  color,
  countLabel,
  emptyLabel,
  recentNames,
}: {
  title: string;
  names: string[];
  color: string;
  countLabel: string;
  emptyLabel: string;
  recentNames: Set<string>;
}) {
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
        {names.length === 0 ? (
          <Text c="dimmed" fz="sm" ta="center" py="md">
            {emptyLabel}
          </Text>
        ) : (
          <Stack gap={4}>
            {names.map((name) => (
              <NameItem key={name} name={name} color={color} isNew={recentNames.has(name)} />
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
}: {
  name: string;
  color: string;
  isNew: boolean;
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
    <Text
      fz="sm"
      px="xs"
      py={4}
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateX(0)' : 'translateX(-10px)',
        // background-color transition is slow so it lingers visibly after isNew → false
        backgroundColor:
          isNew && entered ? `var(--mantine-color-${color}-1)` : 'transparent',
        borderRadius: 6,
        transition:
          'opacity 0.2s ease, transform 0.2s ease, background-color 1s ease',
      }}
    >
      {name}
    </Text>
  );
}
